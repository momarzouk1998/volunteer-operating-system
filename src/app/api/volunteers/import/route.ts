import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, normalizePhone, requireRole } from '@/lib/auth';
import { buildUserSearchText } from '@/lib/format';
import { encryptPII, hashPII } from '@/lib/crypto';
import { NATIONAL_ID_RE } from '@/lib/egypt';

// استيراد جماعي للمتطوعين من ملف Excel — نفس ترتيب حقول فورم «تسجيل متطوع جديد» بالظبط:
// الاسم رباعي* | الرقم القومي | رقم الهاتف* | المحافظة* | المركز/المدينة | الفريق | المستوى التطوعي | المهارات
type ImportRow = {
  name?: string;
  nationalId?: string;
  phone?: string;
  governorate?: string;
  city?: string;
  teamName?: string;
  level?: string;
  skills?: string;
};

export async function POST(request: Request) {
  try {
    const gate = await requireRole(['SUPER_ADMIN', 'VOLUNTEER_MANAGER']);
    if (!gate.ok) return gate.res;
    const user = gate.user;

    const body = await request.json();
    const rows: ImportRow[] = Array.isArray(body?.rows) ? body.rows : [];
    if (!rows.length) {
      return NextResponse.json({ error: 'لا توجد صفوف للاستيراد' }, { status: 400 });
    }
    if (rows.length > 1000) {
      return NextResponse.json({ error: 'الحد الأقصى 1000 صف في المرة الواحدة' }, { status: 400 });
    }

    // نبدأ ترقيم أكواد KAS من آخر كود مستخدَم فعلياً
    const lastUser = await prisma.user.findFirst({
      where: { volunteerCode: { startsWith: 'KAS-' } },
      orderBy: { volunteerCode: 'desc' },
    });
    let nextNum = 1;
    const m = lastUser?.volunteerCode?.match(/KAS-(\d+)/);
    if (m) nextNum = parseInt(m[1], 10) + 1;

    const passwordHash = await hashPassword('123456');

    const results: { row: number; status: 'created' | 'skipped'; code?: string; reason?: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 2; // صف 1 هو رأس الأعمدة في الملف
      try {
        const name = String(r.name || '').trim();
        const phoneRaw = String(r.phone || '').trim();
        const governorate = String(r.governorate || '').trim();

        if (!name || !phoneRaw || !governorate) {
          results.push({ row: rowNum, status: 'skipped', reason: 'الاسم/الهاتف/المحافظة حقول إجبارية' });
          continue;
        }

        const cleanPhone = normalizePhone(phoneRaw);
        const nationalId = String(r.nationalId || '').trim();
        if (nationalId && !NATIONAL_ID_RE.test(nationalId)) {
          results.push({ row: rowNum, status: 'skipped', reason: 'الرقم القومي غير صحيح (يجب 14 رقماً)' });
          continue;
        }
        const nationalIdHash = nationalId ? hashPII(nationalId) : null;

        const existing = await prisma.user.findFirst({
          where: { OR: [{ phone: cleanPhone }, ...(nationalIdHash ? [{ nationalIdHash }] : [])] },
        });
        if (existing) {
          results.push({ row: rowNum, status: 'skipped', reason: `مسجّل مسبقاً (${existing.volunteerCode || existing.phone})` });
          continue;
        }

        const volCode = `KAS-${String(nextNum).padStart(5, '0')}`;
        nextNum++;

        const teamName = String(r.teamName || '').trim() || 'فريق الإغاثة الميدانية';
        const level = String(r.level || '').trim() || 'مبتدئ';
        const city = String(r.city || '').trim() || null;
        const skills = String(r.skills || '').trim() || null;

        const created = await prisma.user.create({
          data: {
            volunteerCode: volCode,
            name,
            nationalId: nationalId ? encryptPII(nationalId) : null,
            nationalIdHash,
            phone: cleanPhone,
            whatsapp: cleanPhone,
            searchText: buildUserSearchText({ name, phone: cleanPhone, volunteerCode: volCode }),
            governorate,
            city,
            skills,
            teamName,
            level,
            status: 'ACTIVE',
            passwordHash,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user.id,
            userName: user.name,
            action: 'CREATE',
            entity: 'Volunteer',
            entityId: created.id,
            details: `استيراد جماعي من Excel: ${name} — ${volCode}`,
          },
        });

        results.push({ row: rowNum, status: 'created', code: volCode });
      } catch (rowErr: any) {
        results.push({ row: rowNum, status: 'skipped', reason: rowErr?.message || 'خطأ غير متوقع' });
      }
    }

    const createdCount = results.filter((r) => r.status === 'created').length;
    const skippedCount = results.length - createdCount;

    return NextResponse.json({
      success: true,
      message: `تم استيراد ${createdCount} متطوع${skippedCount ? `، وتخطّي ${skippedCount} صف` : ''}.`,
      createdCount,
      skippedCount,
      results,
    });
  } catch (err: any) {
    console.error('Error importing volunteers:', err);
    return NextResponse.json({ error: 'فشل استيراد الملف' }, { status: 500 });
  }
}
