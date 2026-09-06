import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhone, requireRole } from '@/lib/auth';
import { notifyRoles, ADMIN_NOTIFY_ROLES } from '@/lib/notify';
import { nextCode } from '@/lib/codes';

export async function GET(request: Request) {
  try {
    const gate = await requireRole(['SUPER_ADMIN', 'VOLUNTEER_MANAGER']);
    if (!gate.ok) return gate.res;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const applications = await prisma.application.findMany({
      where: status && status !== 'الكل' ? { status: status as any } : {},
      orderBy: { createdAt: 'desc' },
      include: { interview: true },
    });

    return NextResponse.json({ success: true, applications });
  } catch (err: any) {
    console.error('Error fetching applications:', err);
    return NextResponse.json({ error: 'خطأ في جلب طلبات التطوع' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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
