import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhone, verifyPassword, signToken } from '@/lib/auth';
import { rateLimit, clientIp } from '@/lib/ratelimit';

export async function POST(request: Request) {
  try {
    const rl = rateLimit(`login:${clientIp(request)}`, 10, 5 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `محاولات دخول كثيرة. حاول بعد ${rl.retryAfter} ثانية.` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const body = await request.json();
    // يقبل identifier (بريد أو هاتف) أو phone للتوافق
    const idRaw: string = (body.identifier || body.phone || '').toString().trim();
    const password: string = body.password;

    if (!idRaw || !password) {
      return NextResponse.json(
        { error: 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف وكلمة المرور' },
        { status: 400 }
      );
    }

    const isEmail = idRaw.includes('@');
    const cleanPhone = normalizePhone(idRaw);
    let user = await prisma.user.findFirst({
      where: isEmail
        ? { email: idRaw.toLowerCase() }
        : { OR: [{ phone: cleanPhone }, { phone: idRaw }, { whatsapp: cleanPhone }] },
    });

    if (!user) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
    }

    if (user.status === 'EXCLUDED') {
      return NextResponse.json({ error: 'تم إيقاف هذا الحساب. يرجى مراجعة إدارة المتطوعين.' }, { status: 403 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
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
      mustChangePassword: user.mustChangePassword,
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
