import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { createNotification } from '@/lib/notify';
import { nextCode } from '@/lib/codes';
import { recalcVolunteer } from '@/lib/volunteerBalance';
import { normalizeArabic } from '@/lib/format';
import crypto from 'crypto';

const CERT_ROLES = ['SUPER_ADMIN', 'VOLUNTEER_MANAGER'] as const;
const MAX_CERT_POINTS = 500; // سقف نقاط الشهادة الواحدة

export async function GET(request: Request) {
  try {
    const gate = await requireRole([...CERT_ROLES]);
    if (!gate.ok) return gate.res;

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20));

    const where: any = {};
    if (search) {
      const words = normalizeArabic(search).split(' ').filter(Boolean);
      where.AND = words.map((w) => ({
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { type: { contains: search, mode: 'insensitive' } },
          { volunteer: { searchText: { contains: w } } },
        ],
      }));
    }

    const [certificates, total] = await Promise.all([
      prisma.reward.findMany({
        where,
        orderBy: { issuedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { volunteer: { select: { id: true, volunteerCode: true, name: true, governorate: true, teamName: true } } },
      }),
      prisma.reward.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      certificates,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err: any) {
    console.error('Error fetching certificates:', err);
    return NextResponse.json({ error: 'خطأ في جلب الشهادات' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const gate = await requireRole([...CERT_ROLES]);
    if (!gate.ok) return gate.res;
    const user = gate.user;

    const body = await request.json();
    const { volunteerId, type, reason, points, notes } = body;

    if (!volunteerId || !type || !reason) {
      return NextResponse.json({ error: 'يرجى استكمال بيانات الشهادة' }, { status: 400 });
    }
    let numPoints = Number(points) || 0;
    if (numPoints < 0) numPoints = 0;
    if (numPoints > MAX_CERT_POINTS) {
      return NextResponse.json({ error: `الحد الأقصى لنقاط الشهادة الواحدة ${MAX_CERT_POINTS} نقطة` }, { status: 400 });
    }

    const vol = await prisma.user.findUnique({ where: { id: volunteerId }, select: { name: true } });
    if (!vol) return NextResponse.json({ error: 'المتطوع غير موجود' }, { status: 404 });

    const code = await nextCode('reward', 'CERT-KAS-2026-', 4);
    const qrToken = crypto.randomBytes(16).toString('hex');

    const reward = await prisma.$transaction(async (tx) => {
      const r = await tx.reward.create({
        data: { code, volunteerId, type, reason, points: numPoints, qrToken, issuedById: user.id, notes: notes || null },
      });
      if (numPoints > 0) {
        await tx.pointsLedger.create({
          data: {
            volunteerId,
            points: numPoints,
            type: 'مكافأة وتقدير رسمي',
            reason: `منح ${type}: ${reason}`,
            createdBy: user.name,
          },
        });
      }
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'CERTIFICATE_ISSUE',
          entity: 'Reward',
          entityId: r.id,
          details: `إصدار ${type} بكود ${code} للمتطوع ${vol.name}${numPoints ? ` (+${numPoints} نقطة)` : ''}`,
        },
      });
      return r;
    });

    if (numPoints > 0) await recalcVolunteer(volunteerId);

    await createNotification({
      userId: volunteerId,
      title: `تم منحك ${type} 🏅`,
      body: reason,
      type: 'CERTIFICATE',
      link: '/profile',
    });

    return NextResponse.json({ success: true, message: `تم إصدار وتوثيق الشهادة بنجاح بكود: ${code}`, reward });
  } catch (err: any) {
    console.error('Error issuing certificate:', err);
    return NextResponse.json({ error: 'فشل في إصدار الشهادة' }, { status: 500 });
  }
}
