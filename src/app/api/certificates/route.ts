import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { volunteerId, type, reason, points, notes } = body;

    if (!volunteerId || !type || !reason) {
      return NextResponse.json({ error: 'يرجى استكمال بيانات الشهادة' }, { status: 400 });
    }

    const count = await prisma.reward.count();
    const code = `CERT-KAS-2026-${String(count + 1).padStart(4, '0')}`;
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
