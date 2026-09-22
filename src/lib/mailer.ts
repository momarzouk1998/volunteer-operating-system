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

// ---- قوالب (مطابقة لهوية الجمعية البصرية: أزرق #00469b + شعار الجمعية) ----

const LOGO_URL = `${APP_BASE_URL}/images/logo.png`;

const BRAND = {
  primary: '#00469b',
  primaryDark: '#00306f',
  primaryLight: '#eaedff',
  gold: '#f59e0b',
  emerald: '#10b981',
  bg: '#f2f4fb',
  card: '#ffffff',
  text: '#1f2937',
  muted: '#6b7280',
};

function escapeHtml(s: string | number | null | undefined): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c] as string));
}

/** الهيكل البصري الموحّد لكل رسائل الجمعية — جدول متوافق مع عملاء البريد (Outlook/Gmail/إلخ). */
function emailShell(opts: { badge: string; heading: string; bodyHtml: string; preheader?: string }) {
  const { badge, heading, bodyHtml, preheader = '' } = opts;
  return `<!doctype html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:Tahoma,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${BRAND.card};border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,70,155,0.10);">
        <tr>
          <td style="background:${BRAND.primary};padding:28px 24px;text-align:center;">
            <img src="${LOGO_URL}" alt="جمعية خواطر أحلى شباب" width="72" height="72" style="display:inline-block;background:#ffffff;border-radius:16px;padding:8px;" />
            <div style="color:#ffffff;font-size:18px;font-weight:bold;margin-top:12px;">جمعية خواطر أحلى شباب</div>
            <div style="color:#d8e2ff;font-size:12px;margin-top:2px;">منظومة إدارة وتشغيل المتطوعين — VOS</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 28px;">
            <div style="display:inline-block;font-size:13px;font-weight:bold;color:${BRAND.primary};background:${BRAND.primaryLight};padding:4px 12px;border-radius:999px;margin-bottom:14px;">${escapeHtml(badge)}</div>
            <h1 style="margin:0 0 16px;font-size:20px;color:${BRAND.primaryDark};">${escapeHtml(heading)}</h1>
            <div style="font-size:14px;line-height:2;color:${BRAND.text};">${bodyHtml}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 28px;background:${BRAND.primaryLight};text-align:center;">
            <div style="font-size:11px;color:${BRAND.muted};">هذه رسالة تلقائية من منظومة VOS — جمعية خواطر أحلى شباب. برجاء عدم الرد على هذا البريد.</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string) {
  return `<div style="text-align:center;margin:24px 0 8px;">
    <a href="${href}" style="display:inline-block;background:${BRAND.primary};color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:13px 32px;border-radius:12px;">${escapeHtml(label)}</a>
  </div>`;
}

function infoRow(label: string, value: string, mono = false) {
  return `<tr>
    <td style="padding:8px 0;color:${BRAND.muted};font-size:13px;white-space:nowrap;">${escapeHtml(label)}</td>
    <td style="padding:8px 0 8px 12px;color:${BRAND.text};font-size:13px;font-weight:bold;${mono ? 'font-family:monospace;direction:ltr;text-align:right;' : ''}">${escapeHtml(value)}</td>
  </tr>`;
}

export function tplInterview(name: string, when: Date, details: string) {
  const body = `
    <p>مرحباً <b>${escapeHtml(name)}</b>،</p>
    <p>يسعدنا إبلاغك بتحديد موعد مقابلتك الشخصية للانضمام لأسرة متطوعي الجمعية:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};border-radius:14px;padding:16px 18px;margin:12px 0;">
      ${infoRow('📅 التاريخ والوقت', when.toLocaleString('ar-EG'))}
      ${infoRow('📍 تفاصيل المكان', details || '—')}
    </table>
    <p>برجاء الحضور في الموعد المحدد، ونتمنى لك التوفيق. 🌟</p>`;
  return {
    subject: 'موعد مقابلة التطوع — جمعية خواطر أحلى شباب',
    html: emailShell({ badge: 'موعد مقابلة', heading: 'تم تحديد موعد مقابلتك', bodyHtml: body, preheader: 'تم تحديد موعد مقابلتك الشخصية للانضمام لأسرة المتطوعين' }),
  };
}

export function tplActivation(name: string, email: string, tempPassword: string, code: string) {
  const body = `
    <p>مبروك <b>${escapeHtml(name)}</b>! 🎉</p>
    <p>تم اعتماد طلب انضمامك رسمياً، وكود عضويتك <b style="color:${BRAND.primary};">${escapeHtml(code)}</b>.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};border-radius:14px;padding:16px 18px;margin:12px 0;">
      ${infoRow('البريد الإلكتروني', email, true)}
      ${infoRow('كلمة السر المؤقتة', tempPassword, true)}
    </table>
    ${ctaButton(`${APP_BASE_URL}/login`, 'الدخول إلى منظومتك الآن')}
    <p style="font-size:12px;color:${BRAND.muted};text-align:center;">سيُطلب منك تغيير كلمة السر عند أول دخول.</p>`;
  return {
    subject: 'تم قبولك — بيانات الدخول لمنظومة المتطوعين',
    html: emailShell({ badge: 'تم القبول 🎉', heading: `أهلاً بك في أسرة المتطوعين، ${name}`, bodyHtml: body, preheader: `كود عضويتك ${code} — بيانات الدخول داخل الرسالة` }),
  };
}

export function tplReset(name: string, link: string) {
  const body = `
    <p>مرحباً <b>${escapeHtml(name)}</b>،</p>
    <p>وصلنا طلب لإعادة تعيين كلمة مرورك. اضغط الزر التالي لاختيار كلمة سر جديدة (الرابط صالح لمدة ساعة واحدة فقط):</p>
    ${ctaButton(link, 'إعادة تعيين كلمة المرور')}
    <p style="font-size:12px;color:${BRAND.muted};text-align:center;word-break:break-all;">أو انسخ الرابط: ${link}</p>
    <p style="font-size:13px;color:${BRAND.muted};margin-top:20px;">إن لم تطلب ذلك، يمكنك تجاهل هذه الرسالة بأمان — لن يتغيّر شيء في حسابك.</p>`;
  return {
    subject: 'إعادة تعيين كلمة المرور — منظومة المتطوعين',
    html: emailShell({ badge: 'إعادة تعيين', heading: 'طلب إعادة تعيين كلمة المرور', bodyHtml: body, preheader: 'اضغط لإعادة تعيين كلمة مرورك — الرابط صالح لمدة ساعة' }),
  };
}
