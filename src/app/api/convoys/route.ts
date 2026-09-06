import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const gate = await requireRole('ANY_AUTH');
    if (!gate.ok) return gate.res;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const governorate = searchParams.get('governorate');

    const whereClause: any = {};
    if (status && status !== 'الكل') whereClause.status = status;
    if (governorate && governorate !== 'الكل') whereClause.governorate = governorate;

    const convoys = await prisma.convoy.findMany({
      where: whereClause,
      orderBy: { startDate: 'asc' },
      include: {
        _count: {
          select: { tasks: true, attendances: true },
        },
      },
    });

    return NextResponse.json({ success: true, convoys });
  } catch (err: any) {
    console.error('Error fetching convoys:', err);
    return NextResponse.json({ error: 'خطأ في جلب بيانات القوافل' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const gate = await requireRole(['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD', 'TEAM_LEADER']);
    if (!gate.ok) return gate.res;
    const user = gate.user;

    const body = await request.json();
    const {
      title,
      type,
      governorate,
      location,
      startDate,
      supervisor,
      requiredCount,
      description,
    } = body;

    if (!title || !type || !governorate || !location || !startDate) {
      return NextResponse.json({ error: 'يرجى استكمال الحقول الأساسية للقافلة' }, { status: 400 });
    }

    const count = await prisma.convoy.count();
    const code = `CNV-2026-${String(count + 1).padStart(3, '0')}`;

    const convoy = await prisma.convoy.create({
      data: {
        code,
        title,
        type,
        governorate,
        location,
        startDate: new Date(startDate),
        supervisor: supervisor || user.name,
        requiredCount: Number(requiredCount) || 20,
        confirmedCount: 0,
        description: description || null,
        status: 'PLANNED',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'CREATE',
        entity: 'Convoy',
        entityId: convoy.id,
        details: `تم إنشاء القافلة الجديدة: ${title} (${code})`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `تم إنشاء القافلة بنجاح بكود: ${code}`,
      convoy,
    });
  } catch (err: any) {
    console.error('Error creating convoy:', err);
    return NextResponse.json({ error: 'فشل في إنشاء القافلة' }, { status: 500 });
  }
}
