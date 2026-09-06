import { prisma } from './prisma';

// القيم الافتراضية لقواعد النقاط وحد عدم النشاط (قابلة للتعديل من صفحة الإعدادات)
export const SETTING_DEFAULTS: Record<string, { value: string; category: string; description: string }> = {
  POINTS_PER_HOUR: { value: '10', category: 'GAMIFICATION', description: 'عدد النقاط لكل ساعة تطوع معتمدة' },
  POINTS_FULL_CONVOY: { value: '50', category: 'GAMIFICATION', description: 'نقاط إضافية عند حضور قافلة كاملة' },
  INACTIVE_DAYS_LIMIT: { value: '60', category: 'GENERAL', description: 'حد أيام عدم النشاط للتحويل لمركز الاستعادة' },
};

/** يضمن وجود مفاتيح الإعدادات الافتراضية في قاعدة البيانات (إنشاء كسول). */
export async function ensureDefaultSettings() {
  for (const [key, def] of Object.entries(SETTING_DEFAULTS)) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: {},
      create: { key, value: def.value, category: def.category, description: def.description },
    });
  }
}

/** يقرأ إعداداً رقمياً من قاعدة البيانات مع قيمة احتياطية. */
export async function getNumberSetting(key: keyof typeof SETTING_DEFAULTS): Promise<number> {
  const fallback = Number(SETTING_DEFAULTS[key].value);
  try {
    const row = await prisma.systemSetting.findUnique({ where: { key } });
    const n = row ? Number(row.value) : NaN;
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}
