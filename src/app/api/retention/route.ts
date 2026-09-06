import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, governorateScope } from '@/lib/auth';
import { getNumberSetting } from '@/lib/settings';

const RETENTION_ROLES = ['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD'] as const;

export async function GET(request: Request) {
  try {
    const gate = await requireRole([...RETENTION_ROLES]);
    if (!gate.ok) return gate.res;
    const scope = governorateScope(gate.user);

    // حد أيام عدم النشاط قابل للتعديل من الإعدادات
    const inactivityDays = await getNumberSetting('INACTIVE_DAYS_LIMIT');
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - inactivityDays);

    const inactiveVolunteers = await prisma.user.findMany({
      where: {
        role: { not: 'SUPER_ADMIN' },
        ...scope,
        OR: [
          { status: 'DISCONTINUED' },
          { status: 'INACTIVE' },
          { lastActiveDate: { lte: cutoff } },
        ],
      },
      orderBy: { lastActiveDate: 'asc' },
      include: {
        retentionRecords: {
          orderBy: { lastContact: 'desc' },
          take: 1,
        },
      },
    });

    return NextResponse.json({ success: true, inactiveVolunteers });
  } catch (err: any) {
    console.error('Error fetching retention list:', err);
    return NextResponse.json({ error: 'خطأ في جلب بيانات استعادة المتطوعين' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const gate = await requireRole([...RETENTION_ROLES]);
    if (!gate.ok) return gate.res;
    const user = gate.user;

    const body = await request.json();
    const {
      volunteerId,
      reason,
      whatMotivated,
      whatEncourages,
      preferredField,
      availableTime,
      wantsToReturn,
      contactOutcome,
      nextAction,
      status,
      notes,
    } = body;

    const record = await prisma.retentionRecord.create({
      data: {
        volunteerId,
        reason: reason || null,
        whatMotivated: whatMotivated || null,
        whatEncourages: whatEncourages || null,
        preferredField: preferredField || null,
        availableTime: availableTime || null,
        wantsToReturn: wantsToReturn || 'نعم يرغب',
        contactOutcome: contactOutcome || 'تم التواصل بنجاح',
        nextAction: nextAction || null,
        assignedToId: user.id,
        status: status || 'قيد المتابعة',
        notes: notes || null,
      },
    });

    // إذا عاد للنشاط
    if (status === 'تمت الاستعادة بنجاح') {
      await prisma.user.update({
        where: { id: volunteerId },
        data: {
          status: 'ACTIVE',
          lastContactDate: new Date(),
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'UPDATE',
        entity: 'Retention',
        entityId: record.id,
        details: `تسجيل نتيجة تواصل ومتابعة استعادة المتطوع`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل متابعة الاستعادة بنجاح',
      record,
    });
  } catch (err: any) {
    console.error('Error adding retention log:', err);
    return NextResponse.json({ error: 'فشل في حفظ سجل الاستعادة' }, { status: 500 });
  }
}
