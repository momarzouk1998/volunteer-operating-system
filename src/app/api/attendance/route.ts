import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { getNumberSetting } from '@/lib/settings';
import { createNotification } from '@/lib/notify';
import { nextCode } from '@/lib/codes';
import { recalcVolunteer } from '@/lib/volunteerBalance';
import { normalizeArabic } from '@/lib/format';
import { isScopedRole } from '@/lib/rbac';

const FIELD_ROLES = ['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD', 'TEAM_LEADER'] as const;

function outOfScope(user: { role: string; governorate?: string | null }, targetGov?: string | null) {
  return isScopedRole(user.role) && user.governorate && targetGov !== user.governorate;
}

export async function GET(request: Request) {
  try {
    const gate = await requireRole([...FIELD_ROLES]);
    if (!gate.ok) return gate.res;
    const scoped = isScopedRole(gate.user.role) && gate.user.governorate ? gate.user.governorate : null;

    const { searchParams } = new URL(request.url);
    const convoyId = searchParams.get('convoyId');
    const volunteerId = searchParams.get('volunteerId');
    const search = (searchParams.get('search') || '').trim();
    const approved = searchParams.get('approved'); // 'yes' | 'no'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20));

    const whereClause: any = {};
    if (convoyId) whereClause.convoyId = convoyId;
    if (volunteerId) whereClause.volunteerId = volunteerId;
    if (approved === 'yes') whereClause.approved = true;
    if (approved === 'no') whereClause.approved = false;
    if (scoped) whereClause.volunteer = { governorate: scoped };
    if (search) {
      const words = normalizeArabic(search).split(' ').filter(Boolean);
      whereClause.AND = words.map((w) => ({
        OR: [
          { activityName: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { volunteer: { searchText: { contains: w } } },
        ],
      }));
    }

    const [attendances, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: whereClause,
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          volunteer: { select: { id: true, volunteerCode: true, name: true, phone: true, governorate: true, teamName: true, level: true } },
          convoy: { select: { id: true, code: true, title: true, type: true, governorate: true } },
        },
      }),
      prisma.attendanceRecord.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      attendances,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err: any) {
    console.error('Error fetching attendances:', err);
    return NextResponse.json({ error: 'خطأ في جلب سجلات الحضور' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const gate = await requireRole([...FIELD_ROLES]);
    if (!gate.ok) return gate.res;

    const body = await request.json();
    const { volunteerId, convoyId, activityName, governorate, date, status, hours, notes } = body;

    if (!volunteerId || !activityName) {
      return NextResponse.json({ error: 'يرجى تحديد المتطوع واسم النشاط' }, { status: 400 });
    }

    const vol = await prisma.user.findUnique({ where: { id: volunteerId }, select: { governorate: true } });
    if (!vol) return NextResponse.json({ error: 'المتطوع غير موجود' }, { status: 404 });
    if (outOfScope(gate.user, vol.governorate)) {
      return NextResponse.json({ error: 'هذا المتطوع خارج نطاق محافظتك' }, { status: 403 });
    }

    const numHours = Number(hours) || 0;
    const code = await nextCode('attendanceRecord', 'ATT-2026-', 4);
    const perHour = await getNumberSetting('POINTS_PER_HOUR');
    const convoyBonus = await getNumberSetting('POINTS_FULL_CONVOY');
    const points = numHours * perHour + (convoyId ? convoyBonus : 0);

    const record = await prisma.attendanceRecord.create({
      data: {
        code,
        volunteerId,
        convoyId: convoyId || null,
        activityName,
        governorate: governorate || vol.governorate || null,
        date: date ? new Date(date) : new Date(),
        status: status || 'PRESENT',
        hours: numHours,
        points,
        approved: false,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `تم تسجيل الحضور برقم ${code}، بانتظار اعتماد المشرف لاحتساب الساعات والنقاط`,
      record,
    });
  } catch (err: any) {
    console.error('Error adding attendance:', err);
    return NextResponse.json({ error: 'فشل في تسجيل الحضور' }, { status: 500 });
  }
}

// اعتماد أو إلغاء اعتماد سجل حضور
export async function PUT(request: Request) {
  try {
    const gate = await requireRole([...FIELD_ROLES]);
    if (!gate.ok) return gate.res;
    const user = gate.user;

    const body = await request.json();
    const { attendanceId, action } = body;

    const record = await prisma.attendanceRecord.findUnique({
      where: { id: attendanceId },
      include: { volunteer: true },
    });
    if (!record) return NextResponse.json({ error: 'سجل الحضور غير موجود' }, { status: 404 });
    if (outOfScope(user, record.volunteer.governorate)) {
      return NextResponse.json({ error: 'هذا المتطوع خارج نطاق محافظتك' }, { status: 403 });
    }

    // ---- إلغاء الاعتماد (تصحيح) ----
    if (action === 'UNAPPROVE') {
      if (!record.approved) {
        return NextResponse.json({ error: 'هذا السجل غير معتمد أصلاً' }, { status: 400 });
      }
      await prisma.$transaction([
        prisma.attendanceRecord.update({
          where: { id: attendanceId },
          data: { approved: false, approvedBy: null, approvedAt: null },
        }),
        prisma.pointsLedger.create({
          data: {
            volunteerId: record.volunteerId,
            points: -record.points,
            type: 'تصحيح / إلغاء اعتماد حضور',
            reason: `إلغاء اعتماد مشاركة: ${record.activityName} (${record.code})`,
            createdBy: user.name,
          },
        }),
        prisma.auditLog.create({
          data: {
            userId: user.id,
            userName: user.name,
            action: 'ATTENDANCE_UNAPPROVE',
            entity: 'Attendance',
            entityId: record.id,
            details: `إلغاء اعتماد ${record.hours} ساعة و ${record.points} نقطة عن ${record.volunteer.name}`,
          },
        }),
      ]);
      const bal = await recalcVolunteer(record.volunteerId);
      await createNotification({
        userId: record.volunteerId,
        title: 'تم إلغاء اعتماد إحدى مشاركاتك',
        body: `${record.activityName} — تم تصحيح رصيدك`,
        type: 'ATTENDANCE',
        link: '/profile',
      });
      return NextResponse.json({ success: true, message: 'تم إلغاء الاعتماد وتصحيح رصيد المتطوع', balance: bal });
    }

    // ---- الاعتماد ----
    if (record.approved) {
      return NextResponse.json({ error: 'تم اعتماد هذا السجل مسبقاً ولا يمكن تكرار الاحتساب' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.attendanceRecord.update({
        where: { id: attendanceId },
        data: { approved: true, approvedBy: user.name, approvedAt: new Date() },
      }),
      prisma.pointsLedger.create({
        data: {
          volunteerId: record.volunteerId,
          points: record.points,
          type: 'ساعات تطوع معتمدة',
          reason: `اعتماد مشاركة في: ${record.activityName} (${record.hours} ساعة)`,
          createdBy: user.name,
        },
      }),
      prisma.user.update({
        where: { id: record.volunteerId },
        data: { lastActiveDate: new Date(), status: record.volunteer.status === 'EXCLUDED' ? undefined : 'ACTIVE' },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'ATTENDANCE_APPROVE',
          entity: 'Attendance',
          entityId: record.id,
          details: `اعتماد ${record.hours} ساعة و ${record.points} نقطة للمتطوع ${record.volunteer.name}`,
        },
      }),
    ]);

    // إعادة احتساب الرصيد والمستوى من مصادر الحقيقة
    const bal = await recalcVolunteer(record.volunteerId);

    await createNotification({
      userId: record.volunteerId,
      title: 'تم اعتماد مشاركتك',
      body: `${record.activityName}: +${record.hours} ساعة و +${record.points} نقطة`,
      type: 'ATTENDANCE',
      link: '/profile',
    });

    return NextResponse.json({
      success: true,
      message: `تم اعتماد السجل. رصيد المتطوع الآن ${bal.totalHours} ساعة و ${bal.totalPoints} نقطة (${bal.level}).`,
      balance: bal,
    });
  } catch (err: any) {
    console.error('Error updating attendance:', err);
    return NextResponse.json({ error: 'فشل في تحديث سجل الحضور' }, { status: 500 });
  }
}
