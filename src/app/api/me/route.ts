import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// ملف المتطوع الشخصي الكامل (360°) للمستخدم المسجّل حالياً
export async function GET() {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { id: current.id },
      include: {
        attendances: {
          orderBy: { date: 'desc' },
          include: { convoy: true },
        },
        taskAssignments: {
          orderBy: { createdAt: 'desc' },
          include: { convoy: true },
        },
        pointsLedger: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        evaluationsReceived: {
          orderBy: { createdAt: 'desc' },
        },
        trainingAttendances: {
          orderBy: { createdAt: 'desc' },
          include: { course: true },
        },
        rewards: {
          orderBy: { issuedAt: 'desc' },
        },
      },
    });

    if (!me) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const { passwordHash, ...safe } = me as any;

    // إحصائيات مشتقّة
    const approvedAttendance = me.attendances.filter((a) => a.approved);
    const presentCount = me.attendances.filter((a) => a.status === 'PRESENT').length;
    const stats = {
      activitiesCount: me.attendances.length,
      approvedCount: approvedAttendance.length,
      presentCount,
      trainingCount: me.trainingAttendances.length,
      passedTrainingCount: me.trainingAttendances.filter((t) => t.passed).length,
      certificatesCount: me.rewards.length,
      evaluationsCount: me.evaluationsReceived.length,
    };

    return NextResponse.json({ success: true, volunteer: safe, stats });
  } catch (err: any) {
    console.error('Error getting my profile:', err);
    return NextResponse.json({ error: 'خطأ في جلب الملف الشخصي' }, { status: 500 });
  }
}
