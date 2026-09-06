import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password || password.length < 6) {
      return NextResponse.json({ error: 'بيانات غير مكتملة (كلمة المرور 6 أحرف على الأقل)' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExp: { gt: new Date() } },
    });
    if (!user) {
      return NextResponse.json({ error: 'الرابط غير صالح أو انتهت صلاحيته' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(password),
        resetToken: null,
        resetTokenExp: null,
        mustChangePassword: false,
      },
    });

    await prisma.auditLog.create({
      data: { userId: user.id, userName: user.name, action: 'PASSWORD_RESET', entity: 'User', entityId: user.id, details: 'إعادة تعيين كلمة المرور عبر البريد' },
    });

    return NextResponse.json({ success: true, message: 'تم تعيين كلمة المرور. يمكنك تسجيل الدخول الآن.' });
  } catch (err: any) {
    console.error('reset-password error:', err);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
