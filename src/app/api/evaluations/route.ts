import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const {
      volunteerId,
      commitment,
      cooperation,
      initiative,
      behavior,
      recommendation,
      notes,
    } = body;

    const c = Number(commitment) || 5;
    const co = Number(cooperation) || 5;
    const i = Number(initiative) || 5;
    const b = Number(behavior) || 5;
    const overall = Number(((c + co + i + b) / 4).toFixed(2));

    const evalRecord = await prisma.evaluation.create({
      data: {
        volunteerId,
        evaluatorId: user.id,
        evaluatorName: user.name,
        commitmentScore: c,
        cooperationScore: co,
        initiativeScore: i,
        behaviorScore: b,
        overallScore: overall,
        recommendation: recommendation || null,
        notes: notes || null,
      },
    });

    // تحديث متوسط التقييم التراكمي للمتطوع
    const allEvals = await prisma.evaluation.findMany({
      where: { volunteerId },
      select: { overallScore: true },
    });

    const sum = allEvals.reduce((acc, curr) => acc + curr.overallScore, 0);
    const newAvg = Number((sum / allEvals.length).toFixed(2));

    await prisma.user.update({
      where: { id: volunteerId },
      data: { rating: newAvg },
    });

    return NextResponse.json({
      success: true,
      message: `تم تسجيل التقييم بنجاح بمعدل ${overall} نجوم!`,
      evaluation: evalRecord,
    });
  } catch (err: any) {
    console.error('Error recording evaluation:', err);
    return NextResponse.json({ error: 'فشل في تسجيل التقييم' }, { status: 500 });
  }
}
