// ============================================================================
//  محرك التنسيق والبحث العربي الموحّد
// ============================================================================

/** تطبيع النص العربي: توحيد الهمزات والياء والتاء المربوطة وحذف التشكيل والتطويل. */
export function normalizeArabic(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ً-ْٰ]/g, '') // إزالة التشكيل
    .replace(/[ـ‏‎]/g, '')       // إزالة التطويل ومحارف الاتجاه
    .replace(/[-_.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** مطابقة بحث عربية مرنة متعددة الكلمات (كل كلمة يجب أن ترد في النص). */
export function matchesArabicSearch(
  target: string | null | undefined,
  query: string | null | undefined
): boolean {
  if (!query || !query.trim()) return true;
  if (!target) return false;
  const normTarget = normalizeArabic(target);
  const words = normalizeArabic(query).split(' ').filter(Boolean);
  return words.every((w) => normTarget.includes(w));
}

/** نص بحث موحّد لسجل مستخدم (اسم + هاتف + كود + رقم قومي). يُخزَّن في العمود searchText. */
export function buildUserSearchText(u: {
  name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  volunteerCode?: string | null;
  nationalId?: string | null;
  email?: string | null;
}): string {
  return normalizeArabic(
    [u.name, u.phone, u.whatsapp, u.volunteerCode, u.nationalId, u.email].filter(Boolean).join(' ')
  );
}

/** تنسيق رقم بفواصل الآلاف بدون رمز عملة. */
export function formatNumber(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === '') return '0';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num)) return '0';
  const hasDecimals = num % 1 !== 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
}
