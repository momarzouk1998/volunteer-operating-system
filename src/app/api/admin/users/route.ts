import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, hashPassword } from '@/lib/auth';
import { createNotification } from '@/lib/notify';
import type { Role } from '@/lib/rbac';

const VALID_ROLES: Role[] = ['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD', 'TEAM_LEADER', 'VOLUNTEER'];

export async function GET(request: Request) {
  try {
    const gate = await requireRole(['SUPER_ADMIN']);
    if (!gate.ok) return gate.res;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('search') || '';

    const users = await prisma.user.findMany({
      where: q
        ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }, { volunteerCode: { contains: q, mode: 'insensitive' } }] }
        : {},
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      select: {
        id: true, name: true, phone: true, volunteerCode: true, role: true,
        governorate: true, teamName: true, status: true, totalPoints: true, createdAt: true,
      },
    });

    return NextResponse.json({ success: true, users });
  } catch (err: any) {
    console.error('admin/users GET error:', err);
    return NextResponse.json({ error: 'خطأ في جلب المستخدمين' }, { status: 500 });
  }
}

// تعديل دور / محافظة / حالة مستخدم، أو تصفير كلمة المرور
export async function PUT(request: Request) {
  try {
    const gate = await requireRole(['SUPER_ADMIN']);
    if (!gate.ok) return gate.res;
    const admin = gate.user;

    const body = await request.json();
    const { id, role, governorate, status, resetPassword } = body;
    if (!id) return NextResponse.json({ error: 'حدّد المستخدم' }, { status: 400 });

    if (id === admin.id && role && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'لا يمكنك إزالة صلاحيتك كمدير عام عن نفسك' }, { status: 400 });
    }
    if (role && !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'دور غير معروف' }, { status: 400 });
    }

    const data: any = {};
    if (role) data.role = role;
    if (governorate !== undefined) data.governorate = governorate || null;
    if (status) data.status = status;
    if (resetPassword) data.passwordHash = await hashPassword('123456');

    const updated = await prisma.user.update({ where: { id }, data });

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        userName: admin.name,
        action: resetPassword ? 'PASSWORD_RESET' : 'ROLE_CHANGE',
        entity: 'User',
        entityId: id,
        details: resetPassword
          ? `تصفير كلمة مرور ${updated.name} إلى الافتراضية`
          : `تحديث صلاحيات ${updated.name}: الدور=${updated.role}${updated.governorate ? '، المحافظة=' + updated.governorate : ''}، الحالة=${updated.status}`,
      },
    });

    await createNotification({
      userId: id,
      title: 'تم تحديث صلاحياتك في المنظومة',
      body: resetPassword ? 'تمت إعادة تعيين كلمة مرورك إلى 123456، يُرجى تغييرها.' : `دورك الحالي: ${updated.role}`,
      type: 'GENERAL',
    });

    return NextResponse.json({ success: true, message: 'تم تحديث المستخدم بنجاح' });
  } catch (err: any) {
    console.error('admin/users PUT error:', err);
    return NextResponse.json({ error: 'فشل تحديث المستخدم' }, { status: 500 });
  }
}
