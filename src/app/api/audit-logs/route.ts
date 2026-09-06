import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET() {
  try {
    const gate = await requireRole(['SUPER_ADMIN']);
    if (!gate.ok) return gate.res;

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, logs });
  } catch (err: any) {
    console.error('Error fetching audit logs:', err);
    return NextResponse.json({ error: 'خطأ في جلب سجل التدقيق' }, { status: 500 });
  }
}
