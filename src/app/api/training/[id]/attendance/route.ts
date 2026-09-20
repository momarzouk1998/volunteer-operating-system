import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

const ROLES = ['SUPER_ADMIN', 'VOLUNTEER_MANAGER'] as const;

// تحديث نتيجة متطوع مسجّل في دورة تدريبية (حضور / نجاح / درجة / ملاحظات)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireRole([...ROLES]);
  if (!gate.ok) return gate.res;
  const { id: courseId } = await params;
  const body = await request.json();
  const { attendanceId, attended, passed, score, notes, certificateCode } = body;

  if (!attendanceId) {
    return NextResponse.json({ error: 'معرّف التسجيل مطلوب' }, { status: 400 });
  }

  const record = await prisma.trainingAttendance.findUnique({ where: { id: attendanceId } });
  if (!record || record.courseId !== courseId) {
    return NextResponse.json({ error: 'سجل التسجيل غير موجود لهذه الدورة' }, { status: 404 });
  }

  const updated = await prisma.trainingAttendance.update({
    where: { id: attendanceId },
    data: {
      attended: attended !== undefined ? Boolean(attended) : undefined,
      passed: passed !== undefined ? Boolean(passed) : undefined,
      score: score !== undefined && score !== '' ? Number(score) : score === '' ? null : undefined,
      notes: notes !== undefined ? (notes || null) : undefined,
      certificateCode: certificateCode !== undefined ? (certificateCode || null) : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: gate.user.id,
      userName: gate.user.name,
      action: 'UPDATE',
      entity: 'TrainingAttendance',
      entityId: attendanceId,
      details: `تحديث نتيجة تدريب: حضور=${updated.attended ? 'نعم' : 'لا'}، نجاح=${updated.passed ? 'نعم' : 'لا'}${updated.score != null ? `، الدرجة=${updated.score}` : ''}`,
    },
  });

  return NextResponse.json({ success: true, attendance: updated });
}

// إزالة متطوع من قائمة المسجّلين في دورة (قبل انعقادها غالباً)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireRole([...ROLES]);
  if (!gate.ok) return gate.res;
  const { id: courseId } = await params;
  const { searchParams } = new URL(request.url);
  const attendanceId = searchParams.get('attendanceId');
  if (!attendanceId) return NextResponse.json({ error: 'معرّف التسجيل مطلوب' }, { status: 400 });

  const record = await prisma.trainingAttendance.findUnique({ where: { id: attendanceId } });
  if (!record || record.courseId !== courseId) {
    return NextResponse.json({ error: 'سجل التسجيل غير موجود لهذه الدورة' }, { status: 404 });
  }

  await prisma.trainingAttendance.delete({ where: { id: attendanceId } });
  return NextResponse.json({ success: true });
}
