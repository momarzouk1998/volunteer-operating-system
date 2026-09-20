import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, normalizePhone } from '@/lib/auth';
import { buildUserSearchText } from '@/lib/format';
import { decryptPII } from '@/lib/crypto';

// الحقول التي يُسمح للمستخدم بتعديلها في ملفه بنفسه (SRS §05: البيانات المسموح بها)
const SELF_EDITABLE = [
  'whatsapp', 'email', 'address', 'city', 'qualification', 'major', 'jobTitle',
  'workplace', 'jobStatus', 'skills', 'experience', 'preferredFields', 'emergencyContact',
  'specialNeeds', 'availableDays', 'availableShift', 'volunteerNature', 'interests', 'volunteerGoals',
] as const;

// ملف المتطوع الشخصي الكامل (360°) للمستخدم المسجّل حالياً
export async function GET() {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { id: current.id },
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
          take: 50,
        },
        evaluationsReceived: {
          orderBy: { createdAt: 'desc' },
        },
        trainingAttendances: {
          orderBy: { createdAt: 'desc' },
          include: { course: true },
        },
        rewards: {
          orderBy: { issuedAt: 'desc' },
        },
      },
    });

    if (!me) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const { passwordHash, ...safe } = me as any;
    safe.nationalId = decryptPII(safe.nationalId);

    // إحصائيات مشتقّة
    const approvedAttendance = me.attendances.filter((a) => a.approved);
    const presentCount = me.attendances.filter((a) => a.status === 'PRESENT').length;
    const stats = {
      activitiesCount: me.attendances.length,
      approvedCount: approvedAttendance.length,
      presentCount,
      trainingCount: me.trainingAttendances.length,
      passedTrainingCount: me.trainingAttendances.filter((t) => t.passed).length,
      certificatesCount: me.rewards.length,
      evaluationsCount: me.evaluationsReceived.length,
    };

    return NextResponse.json({ success: true, volunteer: safe, stats });
  } catch (err: any) {
    console.error('Error getting my profile:', err);
    return NextResponse.json({ error: 'خطأ في جلب الملف الشخصي' }, { status: 500 });
  }
}

// تعديل المستخدم لبياناته المسموح بها بنفسه
export async function PUT(request: Request) {
  try {
    const current = await getCurrentUser();
    if (!current) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await request.json();
    const data: any = {};
    for (const key of SELF_EDITABLE) {
      if (key in body) data[key] = body[key] === '' ? null : body[key];
    }
    if ('dob' in body) data.dob = body.dob ? new Date(body.dob) : null;
    if ('weeklyHours' in body) data.weeklyHours = Number(body.weeklyHours) || null;
    if ('canTravel' in body) data.canTravel = Boolean(body.canTravel);
    if ('whatsapp' in body && body.whatsapp) data.whatsapp = normalizePhone(body.whatsapp);

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: current.id },
      select: { name: true, phone: true, whatsapp: true, volunteerCode: true, email: true },
    });
    data.searchText = buildUserSearchText({
      name: dbUser?.name,
      phone: dbUser?.phone,
      whatsapp: data.whatsapp ?? dbUser?.whatsapp,
      volunteerCode: dbUser?.volunteerCode,
      email: data.email ?? dbUser?.email,
    });

    await prisma.user.update({ where: { id: current.id }, data });
    await prisma.auditLog.create({
      data: {
        userId: current.id,
        userName: current.name,
        action: 'UPDATE',
        entity: 'Volunteer',
        entityId: current.id,
        details: `تحديث المتطوع لبياناته الشخصية (${Object.keys(data).filter((k) => k !== 'searchText').join('، ')})`,
      },
    });

    return NextResponse.json({ success: true, message: 'تم تحديث بياناتك بنجاح' });
  } catch (err: any) {
    console.error('Error updating my profile:', err);
    return NextResponse.json({ error: 'فشل تحديث البيانات' }, { status: 500 });
  }
}
