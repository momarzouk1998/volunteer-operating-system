import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

// حذف سجل متابعة استعادة (خطأ إدخال) — مدير عام فقط
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireRole(['SUPER_ADMIN']);
  if (!gate.ok) return gate.res;
  const { id } = await params;
  await prisma.retentionRecord.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { userId: gate.user.id, userName: gate.user.name, action: 'DELETE', entity: 'Retention', entityId: id, details: 'حذف سجل متابعة استعادة' },
  });
  return NextResponse.json({ success: true });
}
