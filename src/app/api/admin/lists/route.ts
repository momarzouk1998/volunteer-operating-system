import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { ensureDefaultLists, LIST_DEFAULTS } from '@/lib/lists';

export async function GET() {
  const gate = await requireRole(['SUPER_ADMIN']);
  if (!gate.ok) return gate.res;
  await ensureDefaultLists();
  const rows = await prisma.systemSetting.findMany({ where: { category: 'LIST' } });
  const lists = Object.keys(LIST_DEFAULTS).map((key) => {
    const row = rows.find((r) => r.key === key);
    let values: string[] = LIST_DEFAULTS[key as keyof typeof LIST_DEFAULTS].values;
    try {
      if (row) values = JSON.parse(row.value);
    } catch {
      /* keep default */
    }
    return { key, label: LIST_DEFAULTS[key as keyof typeof LIST_DEFAULTS].label, values };
  });
  return NextResponse.json({ success: true, lists });
}

// { key, values: string[] }
export async function PUT(request: Request) {
  const gate = await requireRole(['SUPER_ADMIN']);
  if (!gate.ok) return gate.res;
  const admin = gate.user;
  const { key, values } = await request.json();
  if (!key || !(key in LIST_DEFAULTS)) return NextResponse.json({ error: 'قائمة غير معروفة' }, { status: 400 });
  const clean = Array.isArray(values) ? values.map((v: string) => String(v).trim()).filter(Boolean) : [];
  if (clean.length === 0) return NextResponse.json({ error: 'القائمة لا يمكن أن تكون فارغة' }, { status: 400 });

  await prisma.systemSetting.upsert({
    where: { key },
    update: { value: JSON.stringify(clean) },
    create: { key, value: JSON.stringify(clean), category: 'LIST', description: LIST_DEFAULTS[key as keyof typeof LIST_DEFAULTS].label },
  });

  await prisma.auditLog.create({
    data: { userId: admin.id, userName: admin.name, action: 'SETTINGS_UPDATE', entity: 'SystemSetting', entityId: key, details: `تحديث قائمة ${key} (${clean.length} عنصر)` },
  });

  return NextResponse.json({ success: true });
}
