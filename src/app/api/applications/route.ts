import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhone, requireRole } from '@/lib/auth';
import { notifyRoles, ADMIN_NOTIFY_ROLES } from '@/lib/notify';
import { nextCode } from '@/lib/codes';
import { rateLimit, clientIp } from '@/lib/ratelimit';
import { ARABIC_NAME_RE, EG_PHONE_RE, NATIONAL_ID_RE } from '@/lib/egypt';

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
      fullName, nationalId, gender, dob, phone, whatsapp, email, governorate, city, address,
      qualification, major, skills, preferredFields, emergencyContact,
      volunteeredBefore, prevOrg, prevRole, source, notes,
    } = body;

    // تحقق الخادم من كل الحقول الإجبارية
    const req: [any, string][] = [
      [fullName, 'الاسم'], [nationalId, 'الرقم القومي'], [dob, 'تاريخ الميلاد'], [phone, 'الهاتف'],
      [whatsapp, 'الواتساب'], [email, 'البريد الإلكتروني'], [governorate, 'المحافظة'], [city, 'المركز/المدينة'],
      [address, 'العنوان'], [qualification, 'المؤهل'], [major, 'التخصص'], [skills, 'المهارات'],
      [preferredFields, 'المجالات المفضلة'], [emergencyContact, 'جهة الطوارئ'],
    ];
    for (const [val, label] of req) {
      if (!val || !String(val).trim()) return NextResponse.json({ error: `حقل «${label}» مطلوب` }, { status: 400 });
    }
    if (!ARABIC_NAME_RE.test(String(fullName).trim())) {
      return NextResponse.json({ error: 'الاسم يجب أن يكون بالحروف العربية فقط' }, { status: 400 });
    }
    if (!NATIONAL_ID_RE.test(String(nationalId))) {
      return NextResponse.json({ error: 'الرقم القومي يجب أن يكون 14 رقماً' }, { status: 400 });
    }
    if (gender !== 'ذكر' && gender !== 'أنثى') {
      return NextResponse.json({ error: 'يرجى تحديد النوع (ذكر / أنثى)' }, { status: 400 });
    }
    if (!EG_PHONE_RE.test(String(phone)) || !EG_PHONE_RE.test(String(whatsapp))) {
      return NextResponse.json({ error: 'رقم الهاتف/الواتساب غير صحيح (11 رقماً مصرياً)' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json({ error: 'البريد الإلكتروني غير صحيح' }, { status: 400 });
    }
    if (volunteeredBefore && (!prevOrg?.trim() || !prevRole?.trim())) {
      return NextResponse.json({ error: 'يرجى إدخال بيانات التطوع السابق' }, { status: 400 });
    }

    const cleanPhone = normalizePhone(phone);

    // منع تكرار البريد على حساب موجود
    const emailUser = await prisma.user.findFirst({ where: { email: String(email).toLowerCase() } });
    if (emailUser) {
      return NextResponse.json({ error: 'هذا البريد الإلكتروني مسجّل بالفعل. سجّل الدخول أو استخدم «نسيت كلمة السر».' }, { status: 409 });
    }

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
        nationalId: String(nationalId),
        gender,
        dob: new Date(dob),
        phone: cleanPhone,
        whatsapp: normalizePhone(whatsapp),
        email: String(email).toLowerCase(),
        governorate,
        city: city || null,
        address: address || null,
        qualification: qualification || null,
        major: major || null,
        skills: skills || null,
        preferredFields: preferredFields || null,
        emergencyContact: emergencyContact || null,
        volunteeredBefore: !!volunteeredBefore,
        prevOrg: volunteeredBefore ? prevOrg || null : null,
        prevRole: volunteeredBefore ? prevRole || null : null,
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
