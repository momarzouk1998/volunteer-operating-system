import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'صلاحية المدير العام مطلوبة للاطلاع على سجل التدقيق' }, { status: 403 });
    }

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
