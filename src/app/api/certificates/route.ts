import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { createNotification } from '@/lib/notify';
import { nextCode } from '@/lib/codes';
import crypto from 'crypto';

const CERT_ROLES = ['SUPER_ADMIN', 'VOLUNTEER_MANAGER'] as const;

export async function GET() {
  try {
    const gate = await requireRole([...CERT_ROLES]);
    if (!gate.ok) return gate.res;

    const certificates = await prisma.reward.findMany({
      orderBy: { issuedAt: 'desc' },
      include: {
        volunteer: {
          select: {
            id: true,
            volunteerCode: true,
            name: true,
            governorate: true,
            teamName: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, certificates });
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

    const code = await nextCode('reward', 'CERT-KAS-2026-', 4);
    const qrToken = crypto.randomBytes(16).toString('hex');
    const numPoints = Number(points) || 0;

    const reward = await prisma.reward.create({
      data: {
        code,
        volunteerId,
        type,
        reason,
        points: numPoints,
        qrToken,
        issuedById: user.id,
        notes: notes || null,
      },
      include: { volunteer: true },
    });

    if (numPoints > 0) {
      await prisma.user.update({
        where: { id: volunteerId },
        data: { totalPoints: { increment: numPoints } },
      });

      await prisma.pointsLedger.create({
        data: {
          volunteerId,
          points: numPoints,
          type: 'مكافأة وتقدير رسمي',
          reason: `منح ${type}: ${reason}`,
          createdBy: user.name,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'CERTIFICATE_ISSUE',
        entity: 'Reward',
        entityId: reward.id,
        details: `إصدار ${type} بكود ${code} للمتطوع ${reward.volunteer.name}`,
      },
    });

    await createNotification({
      userId: volunteerId,
      title: `تم منحك ${type} 🏅`,
      body: reason,
      type: 'CERTIFICATE',
      link: '/profile',
    });

    return NextResponse.json({
      success: true,
      message: `تم إصدار وتوثيق الشهادة بنجاح بكود: ${code}`,
      reward,
    });
  } catch (err: any) {
    console.error('Error issuing certificate:', err);
    return NextResponse.json({ error: 'فشل في إصدار الشهادة' }, { status: 500 });
  }
}
