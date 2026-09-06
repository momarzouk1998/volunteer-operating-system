import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { isScopedRole } from '@/lib/rbac';
import { buildUserSearchText } from '@/lib/format';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireRole(['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD', 'TEAM_LEADER']);
    if (!gate.ok) return gate.res;

    const { id } = await params;
    const volunteer = await prisma.user.findFirst({
      where: {
        OR: [{ id }, { volunteerCode: id }],
      },
      include: {
        attendances: {
          orderBy: { date: 'desc' },
          include: { convoy: true },
        },
        taskAssignments: {
          orderBy: { createdAt: 'desc' },
          include: { convoy: true },
        },
        pointsLedger: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        evaluationsReceived: {
          orderBy: { createdAt: 'desc' },
        },
        retentionRecords: {
          orderBy: { createdAt: 'desc' },
        },
        rewards: {
          orderBy: { issuedAt: 'desc' },
        },
        trainingAttendances: {
          include: { course: true },
        },
      },
    });

    if (!volunteer) {
      return NextResponse.json({ error: 'المتطوع غير موجود' }, { status: 404 });
    }

    // قيد نطاق المحافظة
    if (isScopedRole(gate.user.role) && gate.user.governorate && volunteer.governorate !== gate.user.governorate) {
      return NextResponse.json({ error: 'هذا المتطوع خارج نطاق محافظتك' }, { status: 403 });
    }

    return NextResponse.json({ success: true, volunteer });
  } catch (err: any) {
    console.error('Error getting volunteer 360:', err);
    return NextResponse.json({ error: 'خطأ في جلب ملف المتطوع' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireRole(['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD']);
    if (!gate.ok) return gate.res;
    const user = gate.user;

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.user.findUnique({ where: { id }, select: { volunteerCode: true, governorate: true } });
    if (!existing) return NextResponse.json({ error: 'المتطوع غير موجود' }, { status: 404 });
    if (isScopedRole(user.role) && user.governorate && existing.governorate !== user.governorate) {
      return NextResponse.json({ error: 'هذا المتطوع خارج نطاق محافظتك' }, { status: 403 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: body.name,
        nationalId: body.nationalId || null,
        phone: body.phone,
        whatsapp: body.whatsapp || null,
        governorate: body.governorate,
        city: body.city || null,
        address: body.address || null,
        qualification: body.qualification || null,
        major: body.major || null,
        jobTitle: body.jobTitle || null,
        skills: body.skills || null,
        preferredFields: body.preferredFields || null,
        teamName: body.teamName,
        level: body.level,
        status: body.status,
        emergencyContact: body.emergencyContact || null,
        notes: body.notes || null,
        searchText: buildUserSearchText({
          name: body.name,
          phone: body.phone,
          whatsapp: body.whatsapp,
          volunteerCode: existing?.volunteerCode,
          nationalId: body.nationalId,
        }),
      },
    });

    // تسجيل التدقيق
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'UPDATE',
        entity: 'Volunteer',
        entityId: id,
        details: `تم تحديث ملف المتطوع ${updated.name} (${updated.volunteerCode})`,
      },
    });

    return NextResponse.json({ success: true, volunteer: updated });
  } catch (err: any) {
    console.error('Error updating volunteer:', err);
    return NextResponse.json({ error: 'فشل في تحديث بيانات المتطوع' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'صلاحية المدير العام مطلوبة للاستبعاد أو الحذف' }, { status: 403 });
    }

    const { id } = await params;
    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'EXCLUDED' },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'STATUS_CHANGE',
        entity: 'Volunteer',
        entityId: id,
        details: `تم تحويل المتطوع ${updated.name} إلى حالة مستبعد`,
      },
    });

    return NextResponse.json({ success: true, message: 'تم استبعاد المتطوع بنجاح' });
  } catch (err: any) {
    console.error('Error excluding volunteer:', err);
    return NextResponse.json({ error: 'فشل في استبعاد المتطوع' }, { status: 500 });
  }
}
