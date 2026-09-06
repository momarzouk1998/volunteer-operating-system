import { prisma } from './prisma';

// القوائم/التصنيفات القابلة للتعديل — تُخزَّن كصفوف SystemSetting (category = 'LIST', value = JSON array)
export const LIST_DEFAULTS: Record<string, { label: string; values: string[] }> = {
  LIST_LEVELS: {
    label: 'مستويات المتطوع',
    values: ['متطوع جديد', 'متطوع ملتزم', 'متميز', 'قائد فريق', 'قائد قافلة', 'قائد محافظة'],
  },
  LIST_CONVOY_TYPES: {
    label: 'أنواع القوافل',
    values: ['قافلة إغاثية', 'قافلة طبية', 'قافلة إطعام', 'معرض كساء', 'تجهيز عرائس', 'حملة توعية'],
  },
  LIST_TASK_TYPES: {
    label: 'أنواع المهام',
    values: ['توزيع وإغاثة', 'فرز وتعبئة', 'لجنة طبية', 'تنظيم وحشد', 'توثيق وإعلام', 'دعم لوجستي'],
  },
  LIST_TRAINING_TYPES: {
    label: 'أنواع التدريب',
    values: ['تأهيل متطوعين جدد', 'إسعافات أولية', 'مهارات القيادة والتنظيم', 'التوثيق وصناعة المحتوى', 'إدارة الأزمات'],
  },
  LIST_REWARD_TYPES: {
    label: 'أنواع التقدير والشهادات',
    values: ['شهادة تقدير وتكريم', 'درع التميز والعطاء', 'وسام متطوع الشهر', 'شهادة اجتياز دورة قيادية'],
  },
  LIST_SOURCES: {
    label: 'مصادر التعرف على الجمعية',
    values: ['الموقع الإلكتروني', 'صفحة الفيسبوك', 'ترشيح صديق', 'فعالية ميدانية', 'أخرى'],
  },
};

export async function ensureDefaultLists() {
  for (const [key, def] of Object.entries(LIST_DEFAULTS)) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: {},
      create: { key, value: JSON.stringify(def.values), category: 'LIST', description: def.label },
    });
  }
}

export async function getList(key: keyof typeof LIST_DEFAULTS): Promise<string[]> {
  try {
    const row = await prisma.systemSetting.findUnique({ where: { key } });
    if (!row) return LIST_DEFAULTS[key].values;
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) && parsed.length ? parsed : LIST_DEFAULTS[key].values;
  } catch {
    return LIST_DEFAULTS[key].values;
  }
}
