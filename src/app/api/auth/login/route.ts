import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhone, verifyPassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'يرجى إدخال رقم الهاتف وكلمة المرور' },
        { status: 400 }
      );
    }

    const cleanPhone = normalizePhone(phone);
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: phone.trim() },
          { whatsapp: cleanPhone },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'بيانات الدخول غير صحيحة، تأكد من رقم الهاتف' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    const token = await signToken({
      userId: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      volunteerCode: user.volunteerCode,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        volunteerCode: user.volunteerCode,
        avatarUrl: user.avatarUrl,
        level: user.level,
      },
    });

    // 30 days cookie
    response.cookies.set('vos_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم أثناء تسجيل الدخول' },
      { status: 500 }
    );
  }
}
