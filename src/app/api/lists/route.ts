import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { ensureDefaultLists, getList, LIST_DEFAULTS } from '@/lib/lists';
import { getNumberSetting } from '@/lib/settings';

// مصدر موحّد لكل القوائم المنسدلة في الواجهة — لا قوائم ثابتة في الكود
export async function GET() {
  try {
    const gate = await requireRole('ANY_AUTH');
    if (!gate.ok) return gate.res;

    await ensureDefaultLists();

    const [govRows, teamRows, levels, convoyTypes, taskTypes, trainingTypes, rewardTypes, sources, pointsPerHour, fullConvoyPoints, inactiveDays] =
      await Promise.all([
        prisma.governorate.findMany({ orderBy: { name: 'asc' } }),
        prisma.team.findMany({ orderBy: { name: 'asc' } }),
        getList('LIST_LEVELS'),
        getList('LIST_CONVOY_TYPES'),
        getList('LIST_TASK_TYPES'),
        getList('LIST_TRAINING_TYPES'),
        getList('LIST_REWARD_TYPES'),
        getList('LIST_SOURCES'),
        getNumberSetting('POINTS_PER_HOUR'),
        getNumberSetting('POINTS_FULL_CONVOY'),
        getNumberSetting('INACTIVE_DAYS_LIMIT'),
      ]);

    return NextResponse.json({
      success: true,
      governorates: govRows.map((g) => g.name),
      teams: teamRows.map((t) => t.name),
      levels,
      convoyTypes,
      taskTypes,
      trainingTypes,
      rewardTypes,
      sources,
      volunteerStatuses: [
        { value: 'ACTIVE', label: 'نشط' },
        { value: 'INACTIVE', label: 'غير نشط' },
        { value: 'DISTINGUISHED', label: 'متميز' },
        { value: 'DISCONTINUED', label: 'منقطع' },
        { value: 'EXCLUDED', label: 'مستبعد' },
        { value: 'PENDING', label: 'قيد الانتظار' },
      ],
      rules: { pointsPerHour, fullConvoyPoints, inactiveDays },
      listKeys: Object.entries(LIST_DEFAULTS).map(([key, d]) => ({ key, label: d.label })),
    });
  } catch (err: any) {
    console.error('Error fetching lists:', err);
    return NextResponse.json({ error: 'خطأ في جلب القوائم' }, { status: 500 });
  }
}
