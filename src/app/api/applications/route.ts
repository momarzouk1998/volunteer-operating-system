import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, normalizePhone } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

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
      phone,
      whatsapp,
      governorate,
      city,
      qualification,
      major,
      skills,
      preferredFields,
      source,
      notes,
    } = body;

    if (!fullName || !phone || !governorate) {
      return NextResponse.json({ error: 'يرجى إكمال الحقول الأساسية (الاسم، الهاتف، المحافظة)' }, { status: 400 });
    }

    const cleanPhone = normalizePhone(phone);
    const count = await prisma.application.count();
    const newCode = `APP-2026-${String(count + 1).padStart(5, '0')}`;

    const app = await prisma.application.create({
      data: {
        code: newCode,
        fullName,
        nationalId: nationalId || null,
        phone: cleanPhone,
        whatsapp: whatsapp ? normalizePhone(whatsapp) : cleanPhone,
        governorate,
        city: city || null,
        qualification: qualification || null,
        major: major || null,
        skills: skills || null,
        preferredFields: preferredFields || null,
        source: source || 'الموقع الإلكتروني',
        notes: notes || null,
      },
    });

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
