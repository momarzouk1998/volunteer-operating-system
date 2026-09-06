import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// نقطة تحقق عامة (بلا تسجيل دخول) — تعرض بيانات غير حساسة فقط
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) return NextResponse.json({ valid: false }, { status: 400 });

    // 1) شهادة / تكريم
    const reward = await prisma.reward.findFirst({
      where: { OR: [{ code }, { qrToken: code }] },
      include: {
        volunteer: { select: { name: true, volunteerCode: true, governorate: true, teamName: true, status: true } },
      },
    });

    if (reward) {
      return NextResponse.json({
        valid: true,
        kind: 'CERTIFICATE',
        documentCode: reward.code,
        certificateType: reward.type,
        reason: reward.reason,
        issuedAt: reward.issuedAt,
        holderName: reward.volunteer?.name || null,
        volunteerCode: reward.volunteer?.volunteerCode || null,
        governorate: reward.volunteer?.governorate || null,
        team: reward.volunteer?.teamName || null,
      });
    }

    // 2) بطاقة عضوية متطوع
    const volunteer = await prisma.user.findFirst({
      where: { volunteerCode: code },
      select: { name: true, volunteerCode: true, governorate: true, teamName: true, level: true, status: true, createdAt: true },
    });

    if (volunteer) {
      return NextResponse.json({
        valid: volunteer.status !== 'EXCLUDED',
        kind: 'MEMBERSHIP',
        documentCode: volunteer.volunteerCode,
        holderName: volunteer.name,
        volunteerCode: volunteer.volunteerCode,
        governorate: volunteer.governorate,
        team: volunteer.teamName,
        level: volunteer.level,
        issuedAt: volunteer.createdAt,
        status: volunteer.status,
      });
    }

    return NextResponse.json({ valid: false, kind: null });
  } catch (err: any) {
    console.error('Verify error:', err);
    return NextResponse.json({ valid: false, error: 'تعذر التحقق حالياً' }, { status: 500 });
  }
}
