import { prisma } from './prisma';

type ModelKey = 'application' | 'attendanceRecord' | 'convoy' | 'taskAssignment' | 'reward';

const SEQ: Record<ModelKey, string> = {
  application: 'seq_application_code',
  attendanceRecord: 'seq_attendance_code',
  convoy: 'seq_convoy_code',
  taskAssignment: 'seq_task_code',
  reward: 'seq_reward_code',
};

const ensured = new Set<string>();

async function ensureSequence(model: ModelKey, prefix: string) {
  const seq = SEQ[model];
  if (ensured.has(seq)) return;
  // ابدأ التسلسل من أعلى كود موجود + 1 حتى لا تتكرر الأكواد
  const delegate: any = (prisma as any)[model];
  const last = await delegate.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
    select: { code: true },
  });
  let start = 1;
  if (last?.code) {
    const n = parseInt(String(last.code).slice(prefix.length).replace(/\D/g, ''), 10);
    if (Number.isFinite(n)) start = n + 1;
  }
  await prisma.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS "${seq}" START WITH ${start}`);
  // إن كان التسلسل موجوداً بالفعل لكنه متأخر عن البيانات، اضبطه للأعلى
  await prisma.$executeRawUnsafe(
    `SELECT setval('"${seq}"', GREATEST((SELECT last_value FROM "${seq}"), ${start - 1}), true)`
  );
  ensured.add(seq);
}

/** يولّد الكود التالي عبر Postgres SEQUENCE (آمن ضد التزامن). */
export async function nextCode(model: ModelKey, prefix: string, width: number): Promise<string> {
  await ensureSequence(model, prefix);
  const rows = await prisma.$queryRawUnsafe<{ nextval: bigint }[]>(`SELECT nextval('"${SEQ[model]}"') AS nextval`);
  const n = Number(rows[0].nextval);
  return `${prefix}${String(n).padStart(width, '0')}`;
}
