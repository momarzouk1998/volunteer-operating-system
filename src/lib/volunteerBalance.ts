import { prisma } from './prisma';
import { levelForPoints } from './levels';

/**
 * يعيد احتساب رصيد المتطوع من مصادر الحقيقة:
 *  - totalHours  = مجموع ساعات سجلات الحضور المعتمدة
 *  - totalPoints = مجموع حركات دفتر النقاط (PointsLedger)
 *  - convoysCount = عدد القوافل المميزة التي حضرها واعتُمدت
 *  - rating = متوسط التقييمات (أو 5 إن لا يوجد)
 *  - level = يُشتق من النقاط
 * يُستخدم بعد أي تغيير في الرصيد، أو عبر زر "إعادة الاحتساب".
 */
export async function recalcVolunteer(userId: string) {
  const [attAgg, ledgerAgg, convoyRows, evalAgg, user] = await Promise.all([
    prisma.attendanceRecord.aggregate({
      where: { volunteerId: userId, approved: true },
      _sum: { hours: true },
    }),
    prisma.pointsLedger.aggregate({ where: { volunteerId: userId }, _sum: { points: true } }),
    prisma.attendanceRecord.findMany({
      where: { volunteerId: userId, approved: true, convoyId: { not: null } },
      select: { convoyId: true },
      distinct: ['convoyId'],
    }),
    prisma.evaluation.aggregate({ where: { volunteerId: userId }, _avg: { overallScore: true }, _count: true }),
    prisma.user.findUnique({ where: { id: userId }, select: { level: true } }),
  ]);

  const totalHours = attAgg._sum.hours || 0;
  const totalPoints = ledgerAgg._sum.points || 0;
  const convoysCount = convoyRows.length;
  const rating = evalAgg._count > 0 ? Number((evalAgg._avg.overallScore || 0).toFixed(2)) : 5.0;
  const level = await levelForPoints(totalPoints, user?.level);

  await prisma.user.update({
    where: { id: userId },
    data: { totalHours, totalPoints, convoysCount, rating, level },
  });

  return { totalHours, totalPoints, convoysCount, rating, level };
}
