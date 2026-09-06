import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { ensureDefaultSettings } from '@/lib/settings';

export async function GET() {
  try {
    const gate = await requireRole(['SUPER_ADMIN', 'VOLUNTEER_MANAGER']);
    if (!gate.ok) return gate.res;

    await ensureDefaultSettings();
    const settings = await prisma.systemSetting.findMany({ orderBy: { category: 'asc' } });
    const governorates = await prisma.governorate.findMany();
    const teams = await prisma.team.findMany();

    return NextResponse.json({ success: true, settings, governorates, teams });
  } catch (err: any) {
    console.error('Error fetching settings:', err);
    return NextResponse.json({ error: 'خطأ في جلب الإعدادات' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const gate = await requireRole(['SUPER_ADMIN']);
    if (!gate.ok) return gate.res;
    const user = gate.user;

    const body = await request.json();
    const { settings } = body;

    if (Array.isArray(settings)) {
      for (const s of settings) {
        await prisma.systemSetting.upsert({
          where: { key: s.key },
          update: { value: String(s.value) },
          create: {
            key: s.key,
            value: String(s.value),
            category: s.category || 'GENERAL',
            description: s.description || null,
          },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'SETTINGS_UPDATE',
        entity: 'SystemSetting',
        details: 'تم تحديث قواعد احتساب النقاط والإعدادات العامة',
      },
    });

    return NextResponse.json({ success: true, message: 'تم حفظ الإعدادات بنجاح!' });
  } catch (err: any) {
    console.error('Error updating settings:', err);
    return NextResponse.json({ error: 'فشل في حفظ الإعدادات' }, { status: 500 });
  }
}
