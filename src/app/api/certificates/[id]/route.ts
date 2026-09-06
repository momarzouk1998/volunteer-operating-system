import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { createNotification } from '@/lib/notify';

// سحب / إلغاء شهادة أو تكريم (مع خصم النقاط الممنوحة معها)
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireRole(['SUPER_ADMIN', 'VOLUNTEER_MANAGER']);
  if (!gate.ok) return gate.res;
  const { id } = await params;

  const reward = await prisma.reward.findUnique({ where: { id } });
  if (!reward) return NextResponse.json({ error: 'الشهادة غير موجودة' }, { status: 404 });

  await prisma.$transaction([
    prisma.reward.delete({ where: { id } }),
    ...(reward.points > 0
      ? [
          prisma.user.update({ where: { id: reward.volunteerId }, data: { totalPoints: { decrement: reward.points } } }),
          prisma.pointsLedger.create({
            data: {
              volunteerId: reward.volunteerId,
              points: -reward.points,
              type: 'تصحيح / سحب تكريم',
              reason: `سحب ${reward.type} (${reward.code})`,
              createdBy: gate.user.name,
            },
          }),
        ]
      : []),
    prisma.auditLog.create({
      data: { userId: gate.user.id, userName: gate.user.name, action: 'DELETE', entity: 'Reward', entityId: id, details: `سحب ${reward.type} بكود ${reward.code}` },
    }),
  ]);

  await createNotification({
    userId: reward.volunteerId,
    title: 'تم سحب شهادة / تكريم',
    body: `${reward.type} (${reward.code})`,
    type: 'CERTIFICATE',
  });

  return NextResponse.json({ success: true, message: 'تم سحب الشهادة وتصحيح رصيد النقاط' });
}
