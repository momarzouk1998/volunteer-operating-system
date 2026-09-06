import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { notifyRoles, ADMIN_NOTIFY_ROLES } from '@/lib/notify';
import { nextCode } from '@/lib/codes';

const JOIN_PENDING = 'طلب انضمام';

// بوابة المتطوع: الفعاليات/القوافل المتاحة + حالة طلبي لكل قافلة + تكليفاتي
export async function GET() {
  try {
    const gate = await requireRole('ANY_AUTH');
    if (!gate.ok) return gate.res;
    const me = gate.user;

    const convoys = await prisma.convoy.findMany({
      where: { status: { in: ['PLANNED', 'IN_PROGRESS'] } },
      orderBy: { startDate: 'asc' },
      include: { _count: { select: { tasks: true } } },
    });

    const myTasks = await prisma.taskAssignment.findMany({
      where: { volunteerId: me.id },
      orderBy: { createdAt: 'desc' },
      include: { convoy: true },
    });

    const byConvoy: Record<string, string> = {};
    myTasks.forEach((t) => {
      if (!byConvoy[t.convoyId]) byConvoy[t.convoyId] = t.status;
    });

    const events = convoys.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      type: c.type,
      governorate: c.governorate,
      location: c.location,
      startDate: c.startDate,
      supervisor: c.supervisor,
      requiredCount: c.requiredCount,
      confirmedCount: c.confirmedCount,
      status: c.status,
      myStatus: byConvoy[c.id] || null,
    }));

    // الدورات التدريبية القادمة + حالة تسجيلي
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const courses = await prisma.trainingCourse.findMany({
      where: { date: { gte: now } },
      orderBy: { date: 'asc' },
      include: {
        attendances: { where: { volunteerId: me.id }, select: { id: true, attended: true, passed: true } },
      },
    });
    const training = courses.map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      trainer: c.trainer,
      date: c.date,
      hours: c.hours,
      location: c.location,
      isLeadershipPrereq: c.isLeadershipPrereq,
      enrolled: c.attendances.length > 0,
    }));

    return NextResponse.json({ success: true, events, myTasks, training });
  } catch (err: any) {
    console.error('Error fetching events:', err);
    return NextResponse.json({ error: 'خطأ في جلب الفعاليات المتاحة' }, { status: 500 });
  }
}

// طلب المتطوع الانضمام لقافلة أو التسجيل في دورة تدريبية
export async function POST(request: Request) {
  try {
    const gate = await requireRole('ANY_AUTH');
    if (!gate.ok) return gate.res;
    const me = gate.user;

    const bodyJson = await request.json();
    const { convoyId, courseId } = bodyJson;

    // ---- التسجيل الذاتي في دورة تدريبية ----
    if (courseId) {
      const course = await prisma.trainingCourse.findUnique({ where: { id: courseId } });
      if (!course) return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 });
      if (new Date(course.date) < new Date()) {
        return NextResponse.json({ error: 'انتهى موعد هذه الدورة' }, { status: 400 });
      }
      const already = await prisma.trainingAttendance.findUnique({
        where: { courseId_volunteerId: { courseId, volunteerId: me.id } },
      });
      if (already) return NextResponse.json({ error: 'أنت مسجّل في هذه الدورة بالفعل' }, { status: 400 });

      await prisma.trainingAttendance.create({
        data: { courseId, volunteerId: me.id, attended: false, passed: false },
      });
      await notifyRoles(ADMIN_NOTIFY_ROLES, {
        title: 'تسجيل جديد في دورة تدريبية',
        body: `${me.name} سجّل في: ${course.title}`,
        type: 'GENERAL',
        link: '/training',
      }, { governorate: null });
      return NextResponse.json({ success: true, message: 'تم تسجيلك في الدورة، بانتظار اعتماد الإدارة' });
    }

    if (!convoyId) return NextResponse.json({ error: 'حدّد القافلة أو الدورة' }, { status: 400 });

    const convoy = await prisma.convoy.findUnique({ where: { id: convoyId } });
    if (!convoy) return NextResponse.json({ error: 'القافلة غير موجودة' }, { status: 404 });
    if (!['PLANNED', 'IN_PROGRESS'].includes(convoy.status)) {
      return NextResponse.json({ error: 'هذه القافلة غير متاحة للانضمام حالياً' }, { status: 400 });
    }

    const existing = await prisma.taskAssignment.findFirst({
      where: { convoyId, volunteerId: me.id },
    });
    if (existing) {
      return NextResponse.json({ error: 'لديك طلب/تكليف سابق على هذه القافلة' }, { status: 400 });
    }

    const code = await nextCode('taskAssignment', 'TSK-2026-', 4);

    await prisma.taskAssignment.create({
      data: {
        code,
        convoyId,
        volunteerId: me.id,
        taskType: 'انضمام لقافلة',
        role: 'متطوع ميداني',
        status: JOIN_PENDING,
      },
    });

    await notifyRoles(
      ADMIN_NOTIFY_ROLES,
      {
        title: 'طلب انضمام جديد لقافلة',
        body: `${me.name} يطلب الانضمام إلى: ${convoy.title}`,
        type: 'ASSIGNMENT',
        link: `/convoys/${convoy.id}`,
      },
      { governorate: null }
    );

    return NextResponse.json({ success: true, message: 'تم إرسال طلب انضمامك، بانتظار موافقة الإدارة' });
  } catch (err: any) {
    console.error('Error requesting to join event:', err);
    return NextResponse.json({ error: 'فشل إرسال طلب الانضمام' }, { status: 500 });
  }
}
