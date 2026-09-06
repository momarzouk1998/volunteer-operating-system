import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { rateLimit, clientIp } from '@/lib/ratelimit';
import { sendEmail, tplReset, APP_BASE_URL } from '@/lib/mailer';

export async function POST(request: Request) {
  try {
    const rl = rateLimit(`forgot:${clientIp(request)}`, 5, 15 * 60 * 1000);
    if (!rl.ok) return NextResponse.json({ error: 'محاولات كثيرة، حاول لاحقاً' }, { status: 429 });

    const { email } = await request.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'أدخل بريداً إلكترونياً صحيحاً' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({ where: { email: String(email).toLowerCase() } });

    // نرد دائماً بنجاح حتى لا نكشف البريد المسجّل من عدمه
    if (user) {
      const token = crypto.randomBytes(24).toString('hex');
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetTokenExp: new Date(Date.now() + 60 * 60 * 1000) },
      });
      const link = `${APP_BASE_URL}/reset-password?token=${token}`;
      const t = tplReset(user.name, link);
      const r = await sendEmail({ to: user.email!, subject: t.subject, html: t.html });
      if (!r.ok) console.warn('reset email not sent:', r.reason, '| link:', link);
    }

    return NextResponse.json({ success: true, message: 'إن كان البريد مسجّلاً فستصلك رسالة إعادة التعيين.' });
  } catch (err: any) {
    console.error('forgot-password error:', err);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
