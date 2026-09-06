import { prisma } from './prisma';

/**
 * يولّد الكود التالي بناءً على أعلى كود موجود بنفس البادئة (وليس count()+1)
 * حتى لا تتكرر الأكواد بعد حذف سجلات. الأكواد مصفّرة بعرض ثابت فيصح ترتيبها نصياً.
 *
 * width = عدد خانات الرقم المتسلسل بعد البادئة (مثال: APP-2026-00042 → width 5).
 */
export async function nextCode(
  model: 'application' | 'attendanceRecord' | 'convoy' | 'taskAssignment' | 'reward',
  prefix: string,
  width: number
): Promise<string> {
  const delegate: any = (prisma as any)[model];
  const last = await delegate.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
    select: { code: true },
  });
  let n = 1;
  if (last?.code) {
    const tail = String(last.code).slice(prefix.length).replace(/\D/g, '');
    const parsed = parseInt(tail, 10);
    if (Number.isFinite(parsed)) n = parsed + 1;
  }
  return `${prefix}${String(n).padStart(width, '0')}`;
}
