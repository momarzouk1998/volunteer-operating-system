import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { hashPassword, requireRole } from '@/lib/auth';
import { createNotification } from '@/lib/notify';
import { buildUserSearchText } from '@/lib/format';
import { sendEmail, tplActivation, tplInterview } from '@/lib/mailer';

function tempPassword() {
  return crypto.randomBytes(4).toString('hex'); // 8 خانات
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireRole(['SUPER_ADMIN', 'VOLUNTEER_MANAGER']);
  if (!gate.ok) return gate.res;
  const { id } = await params;
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
  if (app.status === 'ACCEPTED') {
    return NextResponse.json({ error: 'لا يمكن حذف طلب تم اعتماده وتحويله لعضوية' }, { status: 400 });
  }
  await prisma.application.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { userId: gate.user.id, userName: gate.user.name, action: 'DELETE', entity: 'Application', entityId: id, details: `حذف طلب تطوع ${app.code} — ${app.fullName}` },
  });
  return NextResponse.json({ success: true });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireRole(['SUPER_ADMIN', 'VOLUNTEER_MANAGER']);
    if (!gate.ok) return gate.res;
    const user = gate.user;

    const { id } = await params;
    const body = await request.json();
    const { action, status, interviewDate, decision, scores, notes } = body;

    const application = await prisma.application.findUnique({
      where: { id },
      include: { interview: true },
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

      const interviewee = await prisma.user.findFirst({ where: { phone: application.phone } });
      if (interviewee) {
        await createNotification({
          userId: interviewee.id,
          title: 'تم تحديد موعد مقابلتك',
          body: `موعد المقابلة: ${new Date(interviewDate).toLocaleString('ar-EG')}`,
          type: 'INTERVIEW',
        });
      }
      if (application.email) {
        const t = tplInterview(application.fullName, new Date(interviewDate), notes || '');
        await sendEmail({ to: application.email, subject: t.subject, html: t.html });
      }

      return NextResponse.json({ success: true, message: 'تم تحديد موعد المقابلة وإرسال إشعار للمتطوع', application: updated });
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
      // منع الاعتماد إذا كانت توصية المقابلة سلبية (إلا بتجاوز صريح)
      const rec = application.interview?.recommendation || '';
      if (!body.force && /مرفوض|غير مستوف|غير مستوٍ|رفض/.test(rec)) {
        return NextResponse.json(
          { error: `توصية المقابلة سلبية (${rec}). للاعتماد رغم ذلك أعد الإرسال بتأكيد التجاوز.`, needsForce: true },
          { status: 409 }
        );
      }

      const existing = await prisma.user.findFirst({
        where: { OR: [{ phone: application.phone }, ...(application.email ? [{ email: application.email }] : [])] },
      });
      const isNew = !existing;
      const tempPw = tempPassword();
      const passwordHash = isNew ? await hashPassword(tempPw) : undefined;
      let volCode = existing?.volunteerCode || null;

      // بيانات محدّثة من الطلب (تُدمج مع القديمة للحساب الموجود)
      const merged = {
        name: application.fullName,
        nationalId: application.nationalId || existing?.nationalId || null,
        dob: application.dob || existing?.dob || null,
        whatsapp: application.whatsapp || existing?.whatsapp || application.phone,
        email: application.email || existing?.email || null,
        governorate: application.governorate || existing?.governorate || 'الجيزة',
        city: application.city || existing?.city || null,
        address: application.address || existing?.address || null,
        qualification: application.qualification || existing?.qualification || null,
        major: application.major || existing?.major || null,
        skills: application.skills || existing?.skills || null,
        preferredFields: application.preferredFields || existing?.preferredFields || null,
        emergencyContact: application.emergencyContact || existing?.emergencyContact || null,
        prevOrg: application.prevOrg || existing?.prevOrg || null,
        prevRole: application.prevRole || existing?.prevRole || null,
      };

      const result = await prisma.$transaction(async (tx) => {
        let userRow = existing;

        if (isNew) {
          const lastUser = await tx.user.findFirst({
            where: { volunteerCode: { startsWith: 'KAS-0' } },
            orderBy: { volunteerCode: 'desc' },
          });
          let nextNum = 1;
          const m = lastUser?.volunteerCode?.match(/KAS-(\d+)/);
          if (m) nextNum = parseInt(m[1], 10) + 1;
          volCode = `KAS-${String(nextNum).padStart(5, '0')}`;

          userRow = await tx.user.create({
            data: {
              ...merged,
              volunteerCode: volCode,
              phone: application.phone,
              searchText: buildUserSearchText({ ...merged, phone: application.phone, volunteerCode: volCode }),
              status: 'ACTIVE',
              level: 'متطوع جديد',
              teamName: 'فريق الإغاثة الميدانية',
              passwordHash: passwordHash!,
              mustChangePassword: true,
            },
          });
        } else {
          userRow = await tx.user.update({
            where: { id: existing!.id },
            data: {
              ...merged,
              searchText: buildUserSearchText({ ...merged, phone: application.phone, volunteerCode: volCode }),
              status: existing!.status === 'EXCLUDED' ? 'ACTIVE' : existing!.status,
            },
          });
        }

        const updatedApp = await tx.application.update({
          where: { id },
          data: { status: 'ACCEPTED', decision: 'مقبول ومعتمد', volunteerCode: volCode, reviewerName: user.name },
        });

        await tx.auditLog.create({
          data: {
            userId: user.id,
            userName: user.name,
            action: 'APPROVE',
            entity: 'Application',
            entityId: id,
            details: `اعتماد طلب التطوع ${application.fullName} — ${isNew ? 'حساب جديد' : 'تحديث حساب قائم'} (${volCode})`,
          },
        });

        return { userId: userRow!.id, updatedApp };
      });

      await createNotification({
        userId: result.userId,
        title: 'تم قبولك في أسرة المتطوعين 🎉',
        body: isNew
          ? `كود عضويتك ${volCode}. الدخول بالبريد ${application.email} وكلمة السر المؤقتة: ${tempPw} (غيّرها عند أول دخول).`
          : `كود عضويتك ${volCode}.`,
        type: 'APPLICATION',
        link: '/profile',
      });

      let emailNote = '';
      if (isNew && application.email) {
        const t = tplActivation(application.fullName, application.email, tempPw, volCode!);
        const r = await sendEmail({ to: application.email, subject: t.subject, html: t.html });
        emailNote = r.ok ? ' وأُرسلت بيانات الدخول على البريد.' : ' (بيانات الدخول في الإشعار — البريد غير مُفعّل بعد).';
      }

      return NextResponse.json({
        success: true,
        message: `تم اعتماد المتطوع وإصدار كود العضوية ${volCode}.${emailNote}`,
        volunteerCode: volCode,
        tempPassword: isNew ? tempPw : undefined,
        application: result.updatedApp,
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

      const rejected = await prisma.user.findFirst({ where: { phone: application.phone } });
      if (rejected) {
        await createNotification({
          userId: rejected.id,
          title: 'تحديث بخصوص طلب التطوع',
          body: 'نعتذر، لم يُقبل طلبك حالياً. يمكنك التواصل مع إدارة المتطوعين لمزيد من التفاصيل.',
          type: 'APPLICATION',
        });
      }

      return NextResponse.json({ success: true, message: 'تم تحديث حالة الطلب إلى مرفوض', application: updated });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    console.error('Error processing application action:', err);
    return NextResponse.json({ error: 'فشل في معالجة طلب التطوع' }, { status: 500 });
  }
}
