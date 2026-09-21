import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, normalizePhone, requireRole, governorateScope } from '@/lib/auth';
import { normalizeArabic, buildUserSearchText } from '@/lib/format';
import { encryptPII, decryptPII, hashPII } from '@/lib/crypto';

const LIST_SELECT = {
  id: true, volunteerCode: true, name: true, nationalId: true, phone: true, whatsapp: true,
  governorate: true, city: true, qualification: true, jobTitle: true, skills: true, status: true,
  level: true, teamName: true, totalHours: true, totalPoints: true, rating: true, convoysCount: true,
  lastActiveDate: true, createdAt: true,
} as const;

export async function GET(request: Request) {
  try {
    const gate = await requireRole(['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD', 'TEAM_LEADER']);
    if (!gate.ok) return gate.res;
    const scope = governorateScope(gate.user);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const governorate = searchParams.get('governorate') || '';
    const team = searchParams.get('team') || '';
    const status = searchParams.get('status') || '';
    const level = searchParams.get('level') || '';
    const sort = searchParams.get('sort') || '';
    const isExport = searchParams.get('export') === '1';

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20));

    const whereClause: any = {
      role: { not: 'SUPER_ADMIN' },
      ...scope,
    };

    if (search.trim()) {
      // بحث عربي مطبَّع متعدد الكلمات: كل كلمة يجب أن ترد في نص البحث
      // الرقم القومي مشفّر — يُبحث عنه بالمطابقة التامة عبر بصمته فقط (وليس جزءاً من النص)
      const words = normalizeArabic(search).split(' ').filter(Boolean);
      whereClause.AND = words.map((w) => {
        const OR: any[] = [{ searchText: { contains: w } }, { phone: { contains: w } }];
        if (/^\d{14}$/.test(w)) OR.push({ nationalIdHash: hashPII(w) });
        return { OR };
      });
    }

    if (governorate && governorate !== 'الكل' && !scope.governorate) whereClause.governorate = governorate;
    if (team && team !== 'الكل') whereClause.teamName = team;
    if (status && status !== 'الكل') whereClause.status = status;
    if (level && level !== 'الكل') whereClause.level = level;

    const orderBy =
      sort === 'points'
        ? [{ totalPoints: 'desc' as const }, { totalHours: 'desc' as const }, { rating: 'desc' as const }]
        : [{ status: 'asc' as const }, { totalPoints: 'desc' as const }];

    if (isExport) {
      const rows = await prisma.user.findMany({ where: whereClause, orderBy, select: LIST_SELECT, take: 10000 });
      return NextResponse.json({
        success: true,
        volunteers: rows.map((r) => ({ ...r, nationalId: decryptPII(r.nationalId) })),
        total: rows.length,
      });
    }

    const [volunteers, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        orderBy,
        select: LIST_SELECT,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      volunteers: volunteers.map((v) => ({ ...v, nationalId: decryptPII(v.nationalId) })),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err: any) {
    console.error('Error fetching volunteers:', err);
    return NextResponse.json({ error: 'خطأ في جلب بيانات المتطوعين' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const gate = await requireRole(['SUPER_ADMIN', 'VOLUNTEER_MANAGER']);
    if (!gate.ok) return gate.res;
    const user = gate.user;

    const body = await request.json();
    const {
      name,
      nationalId,
      phone,
      whatsapp,
      governorate,
      city,
      address,
      qualification,
      major,
      jobTitle,
      skills,
      preferredFields,
      teamName,
      level,
      status,
      notes,
    } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'الاسم ورقم الهاتف حقول مطلوبة' }, { status: 400 });
    }

    const cleanPhone = normalizePhone(phone);
    const nationalIdHash = nationalId ? hashPII(nationalId) : null;
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          nationalIdHash ? { nationalIdHash } : { phone: cleanPhone },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'المتطوع مسجل مسبقاً بنفس رقم الهاتف أو الرقم القومي' }, { status: 400 });
    }

    // توليد كود المتطوع KAS-XXXXX
    const lastUser = await prisma.user.findFirst({
      where: { volunteerCode: { startsWith: 'KAS-' } },
      orderBy: { volunteerCode: 'desc' },
    });

    let nextNum = 1;
    if (lastUser && lastUser.volunteerCode) {
      const match = lastUser.volunteerCode.match(/KAS-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const newCode = `KAS-${String(nextNum).padStart(5, '0')}`;
    const passwordHash = await hashPassword('123456');

    const newVolunteer = await prisma.user.create({
      data: {
        volunteerCode: newCode,
        name,
        nationalId: nationalId ? encryptPII(nationalId) : null,
        nationalIdHash,
        phone: cleanPhone,
        whatsapp: whatsapp ? normalizePhone(whatsapp) : cleanPhone,
        searchText: buildUserSearchText({ name, phone: cleanPhone, whatsapp, volunteerCode: newCode }),
        governorate: governorate || 'الجيزة',
        city: city || null,
        address: address || null,
        qualification: qualification || null,
        major: major || null,
        jobTitle: jobTitle || null,
        skills: skills || null,
        preferredFields: preferredFields || null,
        teamName: teamName || 'فريق الإغاثة الميدانية',
        level: level || 'مبتدئ',
        status: status || 'ACTIVE',
        notes: notes || null,
        passwordHash,
      },
    });

    // سجل الرقابة
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'CREATE',
        entity: 'Volunteer',
        entityId: newVolunteer.id,
        details: `تم تسجيل المتطوع الجديد ${name} وتوليد الكود ${newCode}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `تم تسجيل المتطوع بنجاح وإصدار الكود: ${newCode}`,
      volunteer: newVolunteer,
    });
  } catch (err: any) {
    console.error('Error adding volunteer:', err);
    return NextResponse.json({ error: 'حدث خطأ أثناء حفظ بيانات المتطوع' }, { status: 500 });
  }
}
