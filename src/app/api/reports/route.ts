import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { calcAge } from '@/lib/utils';

// تقارير مجمّعة (SRS §25) — للأدوار الإدارية
export async function GET() {
  try {
    const gate = await requireRole(['SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD']);
    if (!gate.ok) return gate.res;

    const [
      byGov, byStatus, byLevel, volunteers,
      convoys, attendanceAgg, trainingCourses, evalAgg, topTeams,
    ] = await Promise.all([
      prisma.user.groupBy({ by: ['governorate'], where: { role: { not: 'SUPER_ADMIN' } }, _count: { id: true }, _sum: { totalHours: true, totalPoints: true } }),
      prisma.user.groupBy({ by: ['status'], where: { role: { not: 'SUPER_ADMIN' } }, _count: { id: true } }),
      prisma.user.groupBy({ by: ['level'], where: { role: { not: 'SUPER_ADMIN' } }, _count: { id: true } }),
      prisma.user.findMany({ where: { role: { not: 'SUPER_ADMIN' } }, select: { dob: true, skills: true } }),
      prisma.convoy.groupBy({ by: ['status'], _count: { id: true }, _sum: { requiredCount: true, confirmedCount: true } }),
      prisma.attendanceRecord.aggregate({ where: { approved: true }, _sum: { hours: true, points: true }, _count: true }),
      prisma.trainingCourse.findMany({ select: { title: true, _count: { select: { attendances: true } } } }),
      prisma.evaluation.aggregate({ _avg: { overallScore: true }, _count: true }),
      prisma.user.groupBy({ by: ['teamName'], where: { role: { not: 'SUPER_ADMIN' } }, _count: { id: true }, _sum: { totalHours: true, totalPoints: true } }),
    ]);

    // الفئات العمرية
    const ageBands: Record<string, number> = { 'أقل من 18': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45+': 0, 'غير محدد': 0 };
    // توزيع المهارات
    const skillCount: Record<string, number> = {};
    for (const v of volunteers) {
      const a = calcAge(v.dob);
      if (a == null) ageBands['غير محدد']++;
      else if (a < 18) ageBands['أقل من 18']++;
      else if (a < 25) ageBands['18-24']++;
      else if (a < 35) ageBands['25-34']++;
      else if (a < 45) ageBands['35-44']++;
      else ageBands['45+']++;
      (v.skills || '').split(/[،,]/).map((s) => s.trim()).filter(Boolean).forEach((s) => {
        skillCount[s] = (skillCount[s] || 0) + 1;
      });
    }
    const topSkills = Object.entries(skillCount).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      success: true,
      byGovernorate: byGov.map((g) => ({ governorate: g.governorate, count: g._count.id, hours: g._sum.totalHours || 0, points: g._sum.totalPoints || 0 })),
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      byLevel: byLevel.map((l) => ({ level: l.level || 'غير محدد', count: l._count.id })),
      byTeam: topTeams.map((t) => ({ team: t.teamName || 'بدون فريق', count: t._count.id, hours: t._sum.totalHours || 0, points: t._sum.totalPoints || 0 })).sort((a, b) => b.hours - a.hours),
      ageBands: Object.entries(ageBands).map(([band, count]) => ({ band, count })),
      topSkills,
      convoysByStatus: convoys.map((c) => ({ status: c.status, count: c._count.id, required: c._sum.requiredCount || 0, confirmed: c._sum.confirmedCount || 0 })),
      attendance: { approvedHours: attendanceAgg._sum.hours || 0, approvedPoints: attendanceAgg._sum.points || 0, approvedRecords: attendanceAgg._count },
      training: trainingCourses.map((c) => ({ title: c.title, attendees: c._count.attendances })),
      evaluations: { avg: Number((evalAgg._avg.overallScore || 0).toFixed(2)), count: evalAgg._count },
    });
  } catch (err: any) {
    console.error('Error building reports:', err);
    return NextResponse.json({ error: 'خطأ في بناء التقارير' }, { status: 500 });
  }
}
