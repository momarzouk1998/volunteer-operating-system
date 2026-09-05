import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';

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
    const { action, status, interviewDate, decision, scores, notes } = body;

    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json({ error: 'طلب التطوع غير موجود' }, { status: 404 });
    }

    // إجراء 1: تحديد موعد مقابلة
    if (action === 'SCHEDULE_INTERVIEW') {
      const updated = await prisma.application.update({
        where: { id },
        data: {
          status: 'INTERVIEW',
          interviewDate: new Date(interviewDate),
          reviewerName: user.name,
          notes: notes || application.notes,
        },
      });

      return NextResponse.json({ success: true, message: 'تم تحديد موعد المقابلة بنجاح', application: updated });
    }

    // إجراء 2: تسجيل نتيجة المقابلة
    if (action === 'RECORD_INTERVIEW') {
      const { commitment, teamwork, beneficiary, skills, leadership, recommendation, interviewNotes } = scores || {};
      const total = (Number(commitment) || 0) + (Number(teamwork) || 0) + (Number(beneficiary) || 0) + (Number(skills) || 0) + (Number(leadership) || 0);

      await prisma.interview.upsert({
        where: { applicationId: id },
        update: {
          commitmentScore: Number(commitment) || 20,
          teamworkScore: Number(teamwork) || 20,
          beneficiaryScore: Number(beneficiary) || 20,
          skillsScore: Number(skills) || 20,
          leadershipScore: Number(leadership) || 20,
          totalScore: total,
          recommendation: recommendation || 'مقبول',
          notes: interviewNotes || null,
        },
        create: {
          applicationId: id,
          interviewerId: user.id,
          commitmentScore: Number(commitment) || 20,
          teamworkScore: Number(teamwork) || 20,
          beneficiaryScore: Number(beneficiary) || 20,
          skillsScore: Number(skills) || 20,
          leadershipScore: Number(leadership) || 20,
          totalScore: total,
          recommendation: recommendation || 'مقبول',
          notes: interviewNotes || null,
        },
      });

      const updated = await prisma.application.update({
        where: { id },
        data: {
          decision: recommendation,
          reviewerName: user.name,
        },
      });

      return NextResponse.json({ success: true, message: 'تم حفظ تقييم المقابلة بنجاح', application: updated });
    }

    // إجراء 3: اعتماد وقبول المتطوع وتوليد كود KAS رسمي
    if (action === 'APPROVE_VOLUNTEER') {
      // فحص هل له حساب مسجل مسبقاً
      let existingUser = await prisma.user.findFirst({
        where: { phone: application.phone },
      });

      let volCode = existingUser?.volunteerCode;

      if (!existingUser) {
        // توليد كود المتطوع KAS-XXXXX
        const lastUser = await prisma.user.findFirst({
          where: { volunteerCode: { startsWith: 'KAS-' } },
          orderBy: { volunteerCode: 'desc' },
        });

        let nextNum = 1;
        if (lastUser && lastUser.volunteerCode) {
          const match = lastUser.volunteerCode.match(/KAS-(\d+)/);
          if (match) nextNum = parseInt(match[1], 10) + 1;
        }
        volCode = `KAS-${String(nextNum).padStart(5, '0')}`;
        const passwordHash = await hashPassword('123456');

        existingUser = await prisma.user.create({
          data: {
            volunteerCode: volCode,
            name: application.fullName,
            nationalId: application.nationalId || null,
            phone: application.phone,
            whatsapp: application.whatsapp || application.phone,
            governorate: application.governorate,
            city: application.city || null,
            qualification: application.qualification || null,
            major: application.major || null,
            skills: application.skills || null,
            preferredFields: application.preferredFields || null,
            status: 'ACTIVE',
            level: 'متطوع جديد',
            teamName: 'فريق الإغاثة الميدانية',
            passwordHash,
          },
        });
      }

      const updated = await prisma.application.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          decision: 'مقبول ومعتمد',
          volunteerCode: volCode,
          reviewerName: user.name,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'APPROVE',
          entity: 'Application',
          entityId: id,
          details: `تم اعتماد طلب التطوع ${application.fullName} وتوليد الكود ${volCode}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `تم اعتماد المتطوع بنجاح وإصدار كود العضوية: ${volCode}`,
        volunteerCode: volCode,
        application: updated,
      });
    }

    // إجراء 4: رفض الطلب
    if (action === 'REJECT') {
      const updated = await prisma.application.update({
        where: { id },
        data: {
          status: 'REJECTED',
          decision: 'غير مستوفٍ للشروط',
          reviewerName: user.name,
          notes: notes || application.notes,
        },
      });
      return NextResponse.json({ success: true, message: 'تم تحديث حالة الطلب إلى مرفوض', application: updated });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    console.error('Error processing application action:', err);
    return NextResponse.json({ error: 'فشل في معالجة طلب التطوع' }, { status: 500 });
  }
}
