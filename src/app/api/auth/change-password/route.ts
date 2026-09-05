import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'يجب ألا تقل كلمة المرور الجديدة عن 6 أحرف أو أرقام' },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    if (currentPassword) {
      const isMatch = await verifyPassword(currentPassword, dbUser.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: 'كلمة المرور الحالية غير صحيحة' },
          { status: 400 }
        );
      }
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    // تسجيل في الـ Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'PASSWORD_CHANGE',
        entity: 'User',
        entityId: user.id,
        details: 'تم تغيير كلمة المرور بنجاح',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحديث كلمة المرور بنجاح!',
    });
  } catch (err: any) {
    console.error('Password change error:', err);
    return NextResponse.json(
      { error: 'فشل في تغيير كلمة المرور' },
      { status: 500 }
    );
  }
}
