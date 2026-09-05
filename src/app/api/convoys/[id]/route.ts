import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const convoy = await prisma.convoy.findFirst({
      where: { OR: [{ id }, { code: id }] },
      include: {
        tasks: {
          include: { volunteer: true },
        },
        attendances: {
          include: { volunteer: true },
        },
      },
    });

    if (!convoy) {
      return NextResponse.json({ error: 'القافلة غير موجودة' }, { status: 404 });
    }

    return NextResponse.json({ success: true, convoy });
  } catch (err: any) {
    console.error('Error fetching convoy details:', err);
    return NextResponse.json({ error: 'خطأ في جلب تفاصيل القافلة' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.convoy.update({
      where: { id },
      data: {
        title: body.title,
        type: body.type,
        governorate: body.governorate,
        location: body.location,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        supervisor: body.supervisor,
        requiredCount: Number(body.requiredCount),
        confirmedCount: Number(body.confirmedCount),
        status: body.status,
        description: body.description,
      },
    });

    return NextResponse.json({ success: true, convoy: updated });
  } catch (err: any) {
    console.error('Error updating convoy:', err);
    return NextResponse.json({ error: 'فشل في تحديث بيانات القافلة' }, { status: 500 });
  }
}
