import { prisma } from './prisma';

// عتبات المستوى بالنقاط — قابلة للتعديل عبر SystemSetting (category = GAMIFICATION)
export const LEVEL_SETTING_DEFAULTS = {
  LEVEL_PT_COMMITTED: { value: '300', description: 'حد نقاط: متطوع ملتزم' },
  LEVEL_PT_DISTINGUISHED: { value: '700', description: 'حد نقاط: متطوع متميز' },
  LEVEL_PT_TEAM_LEAD: { value: '1500', description: 'حد نقاط: مؤهل لقيادة فريق' },
  LEVEL_PT_AMBASSADOR: { value: '3000', description: 'حد نقاط: سفير عطاء قيادي' },
} as const;

const LADDER: { key: keyof typeof LEVEL_SETTING_DEFAULTS; label: string }[] = [
  { key: 'LEVEL_PT_AMBASSADOR', label: 'قائد محافظة' },
  { key: 'LEVEL_PT_TEAM_LEAD', label: 'قائد فريق' },
  { key: 'LEVEL_PT_DISTINGUISHED', label: 'متميز' },
  { key: 'LEVEL_PT_COMMITTED', label: 'متطوع ملتزم' },
];

export async function ensureLevelSettings() {
  for (const [key, def] of Object.entries(LEVEL_SETTING_DEFAULTS)) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: {},
      create: { key, value: def.value, category: 'GAMIFICATION', description: def.description },
    });
  }
}

/**
 * يحسب المستوى المستحق من إجمالي النقاط.
 * لا يخفّض مستوى قيادي مُسند يدوياً (يحترم القيادة المعتمدة).
 */
export async function levelForPoints(points: number, currentLevel?: string | null): Promise<string> {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: LADDER.map((l) => l.key) } },
  });
  const thr = (k: string, d: string) => Number(rows.find((r) => r.key === k)?.value ?? d);

  for (const rung of LADDER) {
    const t = thr(rung.key, LEVEL_SETTING_DEFAULTS[rung.key].value);
    if (points >= t) return rung.label;
  }

  // إن كان له لقب قيادي مُسند يدوياً ولم يعد مستحقاً بالنقاط، أبقِه كما هو
  if (currentLevel && /قائد|محافظة/.test(currentLevel)) return currentLevel;
  return 'متطوع جديد';
}
