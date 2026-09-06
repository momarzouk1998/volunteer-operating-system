import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { createNotification } from '@/lib/notify';
import { recalcVolunteer } from '@/lib/volunteerBalance';
import { isScopedRole } from '@/lib/rbac';

export async function POST(request: Request) {
  try {
    const gate = await requireRole(['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD', 'TEAM_LEADER']);
    if (!gate.ok) return gate.res;
    const user = gate.user;

    const body = await request.json();
    const {
      volunteerId,
      commitment,
      cooperation,
      initiative,
      behavior,
      recommendation,
      notes,
    } = body;

    const target = await prisma.user.findUnique({ where: { id: volunteerId }, select: { governorate: true } });
    if (!target) return NextResponse.json({ error: 'المتطوع غير موجود' }, { status: 404 });
    if (isScopedRole(user.role) && user.governorate && target.governorate !== user.governorate) {
      return NextResponse.json({ error: 'هذا المتطوع خارج نطاق محافظتك' }, { status: 403 });
    }

    const c = Number(commitment) || 5;
    const co = Number(cooperation) || 5;
    const i = Number(initiative) || 5;
    const b = Number(behavior) || 5;
    const overall = Number(((c + co + i + b) / 4).toFixed(2));

    const evalRecord = await prisma.evaluation.create({
      data: {
        volunteerId,
        evaluatorId: user.id,
        evaluatorName: user.name,
        commitmentScore: c,
        cooperationScore: co,
        initiativeScore: i,
        behaviorScore: b,
        overallScore: overall,
        recommendation: recommendation || null,
        notes: notes || null,
      },
    });

    // إعادة احتساب متوسط التقييم ضمن رصيد المتطوع
    await recalcVolunteer(volunteerId);

    await createNotification({
      userId: volunteerId,
      title: 'تم تسجيل تقييم أداء جديد لك',
      body: `المعدل: ${overall}/5`,
      type: 'GENERAL',
      link: '/profile',
    });

    return NextResponse.json({
      success: true,
      message: `تم تسجيل التقييم بنجاح بمعدل ${overall} نجوم!`,
      evaluation: evalRecord,
    });
  } catch (err: any) {
    console.error('Error recording evaluation:', err);
    return NextResponse.json({ error: 'فشل في تسجيل التقييم' }, { status: 500 });
  }
}
