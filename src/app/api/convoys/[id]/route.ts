import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { createNotification } from '@/lib/notify';

const CONVOY_ADMIN = ['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD', 'TEAM_LEADER'] as const;

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireRole(['SUPER_ADMIN', 'VOLUNTEER_MANAGER']);
  if (!gate.ok) return gate.res;
  const { id } = await params;
  const attCount = await prisma.attendanceRecord.count({ where: { convoyId: id, approved: true } });
  if (attCount > 0) {
    return NextResponse.json({ error: `لا يمكن حذف قافلة بها ${attCount} حضور معتمد` }, { status: 400 });
  }
  // حذف التكليفات وسجلات الحضور غير المعتمدة المرتبطة ثم القافلة
  await prisma.taskAssignment.deleteMany({ where: { convoyId: id } });
  await prisma.attendanceRecord.deleteMany({ where: { convoyId: id } });
  const convoy = await prisma.convoy.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { userId: gate.user.id, userName: gate.user.name, action: 'DELETE', entity: 'Convoy', entityId: id, details: `حذف القافلة ${convoy.code} — ${convoy.title}` },
  });
  return NextResponse.json({ success: true });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireRole('ANY_AUTH');
    if (!gate.ok) return gate.res;

    const { id } = await params;
    const convoy = await prisma.convoy.findFirst({
      where: { OR: [{ id }, { code: id }] },
      include: {
        tasks: {
          include: { volunteer: true },
        },
        attendances: {
          include: { volunteer: true },
        },
      },
    });

    if (!convoy) {
      return NextResponse.json({ error: 'القافلة غير موجودة' }, { status: 404 });
    }

    return NextResponse.json({ success: true, convoy });
  } catch (err: any) {
    console.error('Error fetching convoy details:', err);
    return NextResponse.json({ error: 'خطأ في جلب تفاصيل القافلة' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireRole([...CONVOY_ADMIN]);
    if (!gate.ok) return gate.res;
    const user = gate.user;

    const { id } = await params;
    const body = await request.json();

    // إجراء: البتّ في طلب انضمام متطوع لقافلة (قبول / رفض)
    if (body.action === 'RESOLVE_JOIN') {
      const task = await prisma.taskAssignment.findUnique({
        where: { id: body.taskId },
        include: { convoy: true },
      });
      if (!task) return NextResponse.json({ error: 'طلب الانضمام غير موجود' }, { status: 404 });

      const accepted = body.decision === 'ACCEPT';
      await prisma.$transaction([
        prisma.taskAssignment.update({
          where: { id: task.id },
          data: { status: accepted ? 'مؤكد' : 'مرفوض', supervisor: user.name },
        }),
        ...(accepted
          ? [prisma.convoy.update({ where: { id: task.convoyId }, data: { confirmedCount: { increment: 1 } } })]
          : []),
      ]);
      await createNotification({
        userId: task.volunteerId,
        title: accepted ? 'تم قبول انضمامك للقافلة ✅' : 'تحديث بخصوص طلب انضمامك',
        body: accepted
          ? `أنت الآن ضمن فريق: ${task.convoy.title}`
          : `لم يُقبل طلب انضمامك لقافلة ${task.convoy.title} هذه المرة.`,
        type: 'ASSIGNMENT',
        link: '/events',
      });
      return NextResponse.json({ success: true, message: accepted ? 'تم قبول المتطوع في القافلة' : 'تم رفض الطلب' });
    }

    const updated = await prisma.convoy.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        type: body.type ?? undefined,
        governorate: body.governorate ?? undefined,
        location: body.location ?? undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        supervisor: body.supervisor ?? undefined,
        requiredCount: body.requiredCount !== undefined && body.requiredCount !== null ? Number(body.requiredCount) : undefined,
        confirmedCount: body.confirmedCount !== undefined && body.confirmedCount !== null ? Number(body.confirmedCount) : undefined,
        status: body.status ?? undefined,
        description: body.description ?? undefined,
      },
    });

    return NextResponse.json({ success: true, convoy: updated });
  } catch (err: any) {
    console.error('Error updating convoy:', err);
    return NextResponse.json({ error: 'فشل في تحديث بيانات القافلة' }, { status: 500 });
  }
}
