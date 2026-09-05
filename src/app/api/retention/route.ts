import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // المتطوعون غير النشطين أو من تجاوزوا 60 يوم دون مشاركة
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const inactiveVolunteers = await prisma.user.findMany({
      where: {
        role: { not: 'SUPER_ADMIN' },
        OR: [
          { status: 'DISCONTINUED' },
          { status: 'INACTIVE' },
          { lastActiveDate: { lte: sixtyDaysAgo } },
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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

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
