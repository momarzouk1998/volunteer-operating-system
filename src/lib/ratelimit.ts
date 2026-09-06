// حدّ معدّل بسيط داخل الذاكرة (نافذة منزلقة) — كافٍ لحاوية واحدة.
// يُصفَّر عند إعادة تشغيل الحاوية.

type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

// تنظيف دوري خفيف
let lastSweep = Date.now();
function sweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
}

export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

/**
 * يُرجع true إذا كان الطلب ضمن الحد، false إذا تجاوزه.
 * key: معرّف فريد (مثال: `login:${ip}`)
 */
export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  sweep();
  const now = Date.now();
  const b = store.get(key);
  if (!b || b.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count += 1;
  if (b.count > limit) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}
