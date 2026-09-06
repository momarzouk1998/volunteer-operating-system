import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { getNumberSetting } from '@/lib/settings';

export async function GET() {
  try {
    const gate = await requireRole(['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD', 'TEAM_LEADER']);
    if (!gate.ok) return gate.res;

    const inactiveDays = await getNumberSetting('INACTIVE_DAYS_LIMIT');
    const staleCutoff = new Date(Date.now() - inactiveDays * 86400000);
    const overdueCutoff = new Date(Date.now() - 7 * 86400000);

    // إحصائيات المتطوعين
    const totalVolunteers = await prisma.user.count({
      where: { role: { not: 'SUPER_ADMIN' } },
    });

    const activeVolunteers = await prisma.user.count({
      where: { status: 'ACTIVE' },
    });

    const inactiveVolunteers = await prisma.user.count({
      where: { status: 'INACTIVE' },
    });

    const distinguishedVolunteers = await prisma.user.count({
      where: {
        OR: [
          { level: { contains: 'قائد' } },
          { level: { contains: 'متميز' } },
          { status: 'DISTINGUISHED' },
        ],
      },
    });

    const pendingApps = await prisma.application.count({
      where: { status: { in: ['NEW', 'UNDER_REVIEW', 'INTERVIEW'] } },
    });

    // إجمالي الساعات والنقاط
    const aggregates = await prisma.user.aggregate({
      _sum: {
        totalHours: true,
        totalPoints: true,
      },
    });

    // أفضل المتطوعين (Top 6 Leaderboard)
    const topVolunteers = await prisma.user.findMany({
      where: { role: { not: 'SUPER_ADMIN' } },
      orderBy: [
        { totalPoints: 'desc' },
        { totalHours: 'desc' },
        { rating: 'desc' },
      ],
      take: 6,
      select: {
        id: true,
        volunteerCode: true,
        name: true,
        governorate: true,
        teamName: true,
        level: true,
        totalHours: true,
        totalPoints: true,
        rating: true,
      },
    });

    // القوافل المخططة والقادمة
    const upcomingConvoys = await prisma.convoy.findMany({
      where: { status: { in: ['PLANNED', 'IN_PROGRESS'] } },
      orderBy: { startDate: 'asc' },
      take: 4,
    });

    // توزيع المحافظات
    const governorates = await prisma.governorate.findMany({
      take: 8,
    });

    // نشاط المحافظات بحساب المتطوعين
    const govStats = await prisma.user.groupBy({
      by: ['governorate'],
      _count: { id: true },
      _sum: { totalHours: true, totalPoints: true },
    });

    // مؤشرات إضافية (SRS §24)
    const [levelDist, staleActive, overdueApps, retentionOpen, convoyNeed] = await Promise.all([
      prisma.user.groupBy({ by: ['level'], where: { role: { not: 'SUPER_ADMIN' } }, _count: { id: true } }),
      prisma.user.count({ where: { status: 'ACTIVE', lastActiveDate: { lt: staleCutoff } } }),
      prisma.application.count({ where: { status: { in: ['NEW', 'UNDER_REVIEW'] }, createdAt: { lt: overdueCutoff } } }),
      prisma.retentionRecord.count({ where: { status: { in: ['قيد المتابعة', 'معتذر مؤقتاً'] } } }),
      prisma.convoy.findMany({
        where: { status: { in: ['PLANNED', 'IN_PROGRESS'] } },
        orderBy: { startDate: 'asc' },
        take: 6,
        select: { id: true, code: true, title: true, governorate: true, startDate: true, requiredCount: true, confirmedCount: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalVolunteers,
        activeVolunteers,
        inactiveVolunteers,
        distinguishedVolunteers,
        pendingApps,
        totalHours: aggregates._sum.totalHours || 0,
        totalPoints: aggregates._sum.totalPoints || 0,
        staleActive,
        overdueApps,
        retentionOpen,
      },
      topVolunteers,
      upcomingConvoys,
      govStats,
      governorates,
      levelDist: levelDist.map((l) => ({ level: l.level || 'غير محدد', count: l._count.id })),
      convoyNeed: convoyNeed.map((c) => ({ ...c, shortage: Math.max(0, c.requiredCount - c.confirmedCount) })),
    });
  } catch (err: any) {
    console.error('Dashboard API Error:', err);
    return NextResponse.json({ error: 'خطأ في جلب بيانات لوحة المؤشرات' }, { status: 500 });
  }
}
