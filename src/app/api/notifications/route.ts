import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

// إشعارات المستخدم الحالي
export async function GET() {
  try {
    const gate = await requireRole('ANY_AUTH');
    if (!gate.ok) return gate.res;

    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: gate.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({ where: { userId: gate.user.id, read: false } }),
    ]);

    return NextResponse.json({ success: true, items, unread });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    return NextResponse.json({ error: 'خطأ في جلب الإشعارات' }, { status: 500 });
  }
}

// تعليم كمقروء: { id } لإشعار واحد أو { all: true } للكل
export async function PUT(request: Request) {
  try {
    const gate = await requireRole('ANY_AUTH');
    if (!gate.ok) return gate.res;

    const body = await request.json().catch(() => ({}));
    if (body.all) {
      await prisma.notification.updateMany({
        where: { userId: gate.user.id, read: false },
        data: { read: true, readAt: new Date() },
      });
    } else if (body.id) {
      await prisma.notification.updateMany({
        where: { id: body.id, userId: gate.user.id },
        data: { read: true, readAt: new Date() },
      });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error updating notifications:', err);
    return NextResponse.json({ error: 'فشل تحديث الإشعارات' }, { status: 500 });
  }
}
