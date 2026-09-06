import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, normalizePhone, requireRole, governorateScope } from '@/lib/auth';

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

    const whereClause: any = {
      role: { not: 'SUPER_ADMIN' },
      ...scope,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { volunteerCode: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { nationalId: { contains: search } },
      ];
    }

    if (governorate && governorate !== 'الكل' && !scope.governorate) {
      whereClause.governorate = governorate;
    }

    if (team && team !== 'الكل') {
      whereClause.teamName = team;
    }

    if (status && status !== 'الكل') {
      whereClause.status = status;
    }

    if (level && level !== 'الكل') {
      whereClause.level = level;
    }

    const volunteers = await prisma.user.findMany({
      where: whereClause,
      orderBy: [
        { status: 'asc' },
        { totalPoints: 'desc' },
      ],
      select: {
        id: true,
        volunteerCode: true,
        name: true,
        nationalId: true,
        phone: true,
        whatsapp: true,
        governorate: true,
        city: true,
        qualification: true,
        jobTitle: true,
        skills: true,
        status: true,
        level: true,
        teamName: true,
        totalHours: true,
        totalPoints: true,
        rating: true,
        convoysCount: true,
        lastActiveDate: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, volunteers });
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
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          nationalId ? { nationalId } : { phone: cleanPhone },
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
        nationalId: nationalId || null,
        phone: cleanPhone,
        whatsapp: whatsapp ? normalizePhone(whatsapp) : cleanPhone,
        governorate: governorate || 'الجيزة',
        city: city || null,
        address: address || null,
        qualification: qualification || null,
        major: major || null,
        jobTitle: jobTitle || null,
        skills: skills || null,
        preferredFields: preferredFields || null,
        teamName: teamName || 'فريق الإغاثة الميدانية',
        level: level || 'متطوع جديد',
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
