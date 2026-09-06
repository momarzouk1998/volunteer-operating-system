import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

const ROLES = ['SUPER_ADMIN', 'VOLUNTEER_MANAGER'] as const;

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireRole([...ROLES]);
  if (!gate.ok) return gate.res;
  const { id } = await params;
  const b = await request.json();
  const course = await prisma.trainingCourse.update({
    where: { id },
    data: {
      title: b.title,
      type: b.type,
      trainer: b.trainer,
      date: b.date ? new Date(b.date) : undefined,
      hours: b.hours !== undefined ? Number(b.hours) : undefined,
      isLeadershipPrereq: b.isLeadershipPrereq !== undefined ? Boolean(b.isLeadershipPrereq) : undefined,
      location: b.location ?? undefined,
      status: b.status ?? undefined,
      notes: b.notes ?? undefined,
    },
  });
  return NextResponse.json({ success: true, course });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireRole([...ROLES]);
  if (!gate.ok) return gate.res;
  const { id } = await params;
  const attended = await prisma.trainingAttendance.count({ where: { courseId: id } });
  if (attended > 0) {
    return NextResponse.json({ error: `لا يمكن الحذف: ${attended} متطوع مسجّل في هذه الدورة` }, { status: 400 });
  }
  await prisma.trainingCourse.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { userId: gate.user.id, userName: gate.user.name, action: 'DELETE', entity: 'TrainingCourse', entityId: id, details: 'حذف دورة تدريبية' },
  });
  return NextResponse.json({ success: true });
}
