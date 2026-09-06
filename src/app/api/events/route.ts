import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { notifyRoles, ADMIN_NOTIFY_ROLES } from '@/lib/notify';

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

    return NextResponse.json({ success: true, events, myTasks });
  } catch (err: any) {
    console.error('Error fetching events:', err);
    return NextResponse.json({ error: 'خطأ في جلب الفعاليات المتاحة' }, { status: 500 });
  }
}

// طلب المتطوع الانضمام لقافلة
export async function POST(request: Request) {
  try {
    const gate = await requireRole('ANY_AUTH');
    if (!gate.ok) return gate.res;
    const me = gate.user;

    const { convoyId } = await request.json();
    if (!convoyId) return NextResponse.json({ error: 'حدّد القافلة' }, { status: 400 });

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

    const count = await prisma.taskAssignment.count();
    const code = `TSK-2026-${String(count + 1).padStart(4, '0')}`;

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
