import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET() {
  try {
    const gate = await requireRole('ANY_AUTH');
    if (!gate.ok) return gate.res;

    const courses = await prisma.trainingCourse.findMany({
      orderBy: { date: 'desc' },
      include: {
        _count: { select: { attendances: true } },
        attendances: {
          include: {
            volunteer: {
              select: { id: true, volunteerCode: true, name: true, phone: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, courses });
  } catch (err: any) {
    console.error('Error fetching training courses:', err);
    return NextResponse.json({ error: 'خطأ في جلب بيانات التدريب' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const gate = await requireRole(['SUPER_ADMIN', 'VOLUNTEER_MANAGER']);
    if (!gate.ok) return gate.res;

    const body = await request.json();
    const { title, type, trainer, date, hours, isLeadershipPrereq, location, notes } = body;

    if (!title || !type || !trainer || !date) {
      return NextResponse.json({ error: 'يرجى إكمال بيانات الدورة التدريبية' }, { status: 400 });
    }

    const course = await prisma.trainingCourse.create({
      data: {
        title,
        type,
        trainer,
        date: new Date(date),
        hours: Number(hours) || 4,
        isLeadershipPrereq: Boolean(isLeadershipPrereq),
        location: location || 'مقر الجمعية الرئيسي',
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء الدورة التدريبية بنجاح!',
      course,
    });
  } catch (err: any) {
    console.error('Error creating course:', err);
    return NextResponse.json({ error: 'فشل في إنشاء الدورة التدريبية' }, { status: 500 });
  }
}
