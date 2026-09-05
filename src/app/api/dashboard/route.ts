import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

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
      },
      topVolunteers,
      upcomingConvoys,
      govStats,
      governorates,
    });
  } catch (err: any) {
    console.error('Dashboard API Error:', err);
    return NextResponse.json({ error: 'خطأ في جلب بيانات لوحة المؤشرات' }, { status: 500 });
  }
}
