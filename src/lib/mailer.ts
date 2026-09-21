import { prisma } from './prisma';
import nodemailer from 'nodemailer';

// ============================================================================
//  طبقة إرسال البريد — جاهزة لتفعيل SMTP عند توفير بيانات الخادم في متغيرات البيئة:
//    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, APP_BASE_URL
//  حتى ذلك الحين: يسجّل الرسالة في AuditLog (entity=Email) ويعيد ok:false مع reason.
// ============================================================================

export const APP_BASE_URL = process.env.APP_BASE_URL || 'https://vos.ahlashabab.com';

function smtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

type Mail = { to: string; subject: string; html: string; text?: string };

export async function sendEmail(mail: Mail): Promise<{ ok: boolean; reason?: string }> {
  if (!smtpConfigured()) {
    // لا يوجد SMTP بعد — نسجّل النية فقط
    try {
      await prisma.auditLog.create({
        data: {
          action: 'EMAIL_QUEUED',
          entity: 'Email',
          userName: 'النظام',
          details: `[لم يُرسل — SMTP غير مُهيّأ] إلى ${mail.to} • ${mail.subject}`,
        },
      });
    } catch {
      /* ignore */
    }
    return { ok: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      // فشل سريع بدل تعليق الطلب دقائق لو بورت SMTP محجوب على مستوى الشبكة
      connectionTimeout: 8000,
      greetingTimeout: 5000,
      socketTimeout: 8000,
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: mail.to,
      subject: mail.subject,
      text: mail.text || mail.html.replace(/<[^>]+>/g, ' '),
      html: mail.html,
    });
    return { ok: true };
  } catch (err: any) {
    console.error('sendEmail failed:', err);
    // سجّل المحاولة الفاشلة أيضاً (شبكة/مصادقة) حتى لا تختفي بصمت
    try {
      await prisma.auditLog.create({
        data: {
          action: 'EMAIL_FAILED',
          entity: 'Email',
          userName: 'النظام',
          details: `[فشل الإرسال] إلى ${mail.to} • ${mail.subject} • ${String(err?.message || err)}`,
        },
      });
    } catch { /* ignore */ }
    return { ok: false, reason: String(err?.message || err) };
  }
}

// ---- قوالب ----
export function tplInterview(name: string, when: Date, details: string) {
  return {
    subject: 'موعد مقابلة التطوع — جمعية خواطر أحلى شباب',
    html: `<div dir="rtl" style="font-family:Tahoma,Arial">
      <p>مرحباً ${name}،</p>
      <p>تم تحديد موعد مقابلتك الشخصية للانضمام لأسرة متطوعي الجمعية:</p>
      <ul>
        <li><b>التاريخ والوقت:</b> ${when.toLocaleString('ar-EG')}</li>
        <li><b>تفاصيل:</b> ${details || '—'}</li>
      </ul>
      <p>برجاء الحضور في الموعد. بالتوفيق.</p>
    </div>`,
  };
}

export function tplActivation(name: string, email: string, tempPassword: string, code: string) {
  return {
    subject: 'تم قبولك — بيانات الدخول لمنظومة المتطوعين',
    html: `<div dir="rtl" style="font-family:Tahoma,Arial">
      <p>مبروك ${name}، تم اعتماد طلب انضمامك وكود عضويتك <b>${code}</b>.</p>
      <p>بيانات الدخول لأول مرة:</p>
      <ul>
        <li><b>رابط الدخول:</b> <a href="${APP_BASE_URL}/login">${APP_BASE_URL}/login</a></li>
        <li><b>البريد:</b> ${email}</li>
        <li><b>كلمة السر المؤقتة:</b> ${tempPassword}</li>
      </ul>
      <p>سيُطلب منك تغيير كلمة السر عند أول دخول.</p>
    </div>`,
  };
}

export function tplReset(name: string, link: string) {
  return {
    subject: 'إعادة تعيين كلمة المرور — منظومة المتطوعين',
    html: `<div dir="rtl" style="font-family:Tahoma,Arial">
      <p>مرحباً ${name}،</p>
      <p>لإعادة تعيين كلمة مرورك اضغط الرابط التالي (صالح لمدة ساعة):</p>
      <p><a href="${link}">${link}</a></p>
      <p>إن لم تطلب ذلك تجاهل هذه الرسالة.</p>
    </div>`,
  };
}
