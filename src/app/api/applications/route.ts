import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhone, requireRole } from '@/lib/auth';
import { notifyRoles, ADMIN_NOTIFY_ROLES } from '@/lib/notify';
import { nextCode } from '@/lib/codes';
import { rateLimit, clientIp } from '@/lib/ratelimit';

export async function GET(request: Request) {
  try {
    const gate = await requireRole(['SUPER_ADMIN', 'VOLUNTEER_MANAGER']);
    if (!gate.ok) return gate.res;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = (searchParams.get('search') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20));

    const where: any = {};
    if (status && status !== 'الكل') where.status = status;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search.replace(/\s/g, '') } },
        { governorate: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { interview: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.application.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      applications,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err: any) {
    console.error('Error fetching applications:', err);
    return NextResponse.json({ error: 'خطأ في جلب طلبات التطوع' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // حدّ معدّل: 5 طلبات/ساعة لكل عنوان IP
    const rl = rateLimit(`apply:${clientIp(request)}`, 5, 60 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'تم استلام عدد كبير من الطلبات من جهازك. برجاء المحاولة لاحقاً.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const body = await request.json();
    const {
      fullName,
      nationalId,
      dob,
      phone,
      whatsapp,
      email,
      governorate,
      city,
      address,
      qualification,
      major,
      skills,
      preferredFields,
      emergencyContact,
      source,
      notes,
    } = body;

    if (!fullName || !phone || !governorate) {
      return NextResponse.json({ error: 'يرجى إكمال الحقول الأساسية (الاسم، الهاتف، المحافظة)' }, { status: 400 });
    }

    const cleanPhone = normalizePhone(phone);

    // كشف طلب مكرر قيد المراجعة بنفس الرقم
    const pending = await prisma.application.findFirst({
      where: { phone: cleanPhone, status: { in: ['NEW', 'UNDER_REVIEW', 'INTERVIEW'] } },
    });
    if (pending) {
      return NextResponse.json(
        { error: `لديك طلب قيد المراجعة بالفعل برقم ${pending.code}. سيتم التواصل معك.` },
        { status: 409 }
      );
    }

    const newCode = await nextCode('application', 'APP-2026-', 5);

    const app = await prisma.application.create({
      data: {
        code: newCode,
        fullName,
        nationalId: nationalId || null,
        dob: dob ? new Date(dob) : null,
        phone: cleanPhone,
        whatsapp: whatsapp ? normalizePhone(whatsapp) : cleanPhone,
        email: email || null,
        governorate,
        city: city || null,
        address: address || null,
        qualification: qualification || null,
        major: major || null,
        skills: skills || null,
        preferredFields: preferredFields || null,
        emergencyContact: emergencyContact || null,
        source: source || 'الموقع الإلكتروني',
        notes: notes || null,
      },
    });

    await notifyRoles(ADMIN_NOTIFY_ROLES, {
      title: 'طلب تطوع جديد',
      body: `${fullName} — ${governorate} (${newCode})`,
      type: 'APPLICATION',
      link: '/applications',
    }, { governorate: null });

    return NextResponse.json({
      success: true,
      message: `تم استلام طلب التطوع بنجاح! رقم طلبك هو: ${newCode}`,
      application: app,
    });
  } catch (err: any) {
    console.error('Error submitting application:', err);
    return NextResponse.json({ error: 'حدث خطأ أثناء تقديم الطلب' }, { status: 500 });
  }
}
