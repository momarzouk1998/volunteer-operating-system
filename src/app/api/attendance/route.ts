import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { getNumberSetting } from '@/lib/settings';
import { createNotification } from '@/lib/notify';
import { nextCode } from '@/lib/codes';

const FIELD_ROLES = ['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD', 'TEAM_LEADER'] as const;

export async function GET(request: Request) {
  try {
    const gate = await requireRole([...FIELD_ROLES]);
    if (!gate.ok) return gate.res;

    const { searchParams } = new URL(request.url);
    const convoyId = searchParams.get('convoyId');
    const volunteerId = searchParams.get('volunteerId');

    const whereClause: any = {};
    if (convoyId) whereClause.convoyId = convoyId;
    if (volunteerId) whereClause.volunteerId = volunteerId;

    const attendances = await prisma.attendanceRecord.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: {
        volunteer: {
          select: {
            id: true,
            volunteerCode: true,
            name: true,
            phone: true,
            governorate: true,
            teamName: true,
            level: true,
          },
        },
        convoy: {
          select: {
            id: true,
            code: true,
            title: true,
            type: true,
            governorate: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, attendances });
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
    const {
      volunteerId,
      convoyId,
      activityName,
      governorate,
      date,
      status,
      hours,
      notes,
    } = body;

    if (!volunteerId || !activityName) {
      return NextResponse.json({ error: 'يرجى تحديد المتطوع واسم النشاط' }, { status: 400 });
    }

    const numHours = Number(hours) || 0;
    const code = await nextCode('attendanceRecord', 'ATT-2026-', 4);

    // حساب النقاط التقديرية وفق قواعد النقاط القابلة للتعديل من الإعدادات
    const perHour = await getNumberSetting('POINTS_PER_HOUR');
    const convoyBonus = await getNumberSetting('POINTS_FULL_CONVOY');
    const points = numHours * perHour + (convoyId ? convoyBonus : 0);

    const record = await prisma.attendanceRecord.create({
      data: {
        code,
        volunteerId,
        convoyId: convoyId || null,
        activityName,
        governorate: governorate || null,
        date: date ? new Date(date) : new Date(),
        status: status || 'PRESENT',
        hours: numHours,
        points,
        approved: false, // لا تُعتمد تلقائياً حتى يعتمدها المشرف
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

// اعتماد الساعات والنقاط (Approval Workflow)
export async function PUT(request: Request) {
  try {
    const gate = await requireRole([...FIELD_ROLES]);
    if (!gate.ok) return gate.res;
    const user = gate.user;

    const body = await request.json();
    const { attendanceId } = body;

    const record = await prisma.attendanceRecord.findUnique({
      where: { id: attendanceId },
      include: { volunteer: true },
    });

    if (!record) {
      return NextResponse.json({ error: 'سجل الحضور غير موجود' }, { status: 404 });
    }

    if (record.approved) {
      return NextResponse.json({ error: 'تم اعتماد هذا السجل مسبقاً ولا يمكن تكرار الاحتساب' }, { status: 400 });
    }

    // اعتماد ذرّي: الحضور + ترحيل الرصيد + سجل النقاط + التدقيق في معاملة واحدة
    const [updated] = await prisma.$transaction([
      prisma.attendanceRecord.update({
        where: { id: attendanceId },
        data: { approved: true, approvedBy: user.name, approvedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: record.volunteerId },
        data: {
          totalHours: { increment: record.hours },
          totalPoints: { increment: record.points },
          convoysCount: record.convoyId ? { increment: 1 } : undefined,
          lastActiveDate: new Date(),
          status: 'ACTIVE',
        },
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

    // 5. إشعار المتطوع
    await createNotification({
      userId: record.volunteerId,
      title: 'تم اعتماد مشاركتك',
      body: `${record.activityName}: +${record.hours} ساعة و +${record.points} نقطة`,
      type: 'ATTENDANCE',
      link: '/profile',
    });

    return NextResponse.json({
      success: true,
      message: `تم اعتماد السجل وإضافة ${record.hours} ساعة و ${record.points} نقطة لرصيد المتطوع بنجاح!`,
      record: updated,
    });
  } catch (err: any) {
    console.error('Error approving attendance:', err);
    return NextResponse.json({ error: 'فشل في اعتماد سجل الحضور' }, { status: 500 });
  }
}
