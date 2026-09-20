import crypto from 'crypto';

// ============================================================================
//  تشفير البيانات الحساسة عند التخزين (SRS: الرقم القومي)
//  AES-256-GCM بمفتاح من متغير البيئة ENCRYPTION_KEY (64 حرف hex = 32 بايت)
//  + بصمة HMAC-SHA256 (nationalIdHash) للبحث الدقيق/منع التكرار دون تخزين نص صريح.
//  ملاحظة: التشفير غير حتمي (IV عشوائي في كل مرة) لذا لا يصلح للفرادة المباشرة —
//  الفرادة والبحث الدقيق عبر عمود الهاش المنفصل فقط.
// ============================================================================

const ALGO = 'aes-256-gcm';

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY غير مُهيّأ بشكل صحيح (يلزم 64 حرف hex = 32 بايت)');
  }
  return Buffer.from(hex, 'hex');
}

/** تشفير نص حساس (رقم قومي مثلاً) قبل التخزين. */
export function encryptPII(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(String(plain).trim(), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

/** فك التشفير عند العرض. يعيد القيمة كما هي إن كانت غير مشفّرة (بيانات سابقة على التفعيل). */
export function decryptPII(payload: string | null | undefined): string | null {
  if (!payload) return null;
  try {
    const key = getKey();
    const buf = Buffer.from(payload, 'base64');
    if (buf.length < 29) return payload; // نص قديم غير مشفّر
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return dec.toString('utf8');
  } catch {
    return payload; // فشل فك التشفير (مفتاح مختلف/نص قديم) — أعد القيمة الخام بدل الانهيار
  }
}

/** بصمة ثابتة (HMAC-SHA256) للفرادة والبحث الدقيق دون تخزين النص الصريح. */
export function hashPII(plain: string): string {
  const key = getKey();
  return crypto.createHmac('sha256', key).update(String(plain).trim()).digest('hex');
}

export function maskNationalId(plain: string | null | undefined): string | null {
  if (!plain) return null;
  return `****${String(plain).slice(-4)}`;
}
