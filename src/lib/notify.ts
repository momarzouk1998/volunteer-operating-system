import { prisma } from './prisma';
import { ALL_ADMIN_ROLES, type Role } from './rbac';

type NotifyInput = {
  userId: string;
  title: string;
  body?: string;
  type?: string;
  link?: string;
};

/** ينشئ إشعاراً لمستخدم واحد. لا يرمي خطأ حتى لا يُفشل العملية الأصلية. */
export async function createNotification(input: NotifyInput) {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        body: input.body || null,
        type: input.type || 'GENERAL',
        link: input.link || null,
      },
    });
  } catch (err) {
    console.error('createNotification failed:', err);
  }
}

/** ينشئ إشعاراً لكل المستخدمين ضمن أدوار معيّنة (مثلاً لإبلاغ الإدارة). */
export async function notifyRoles(
  roles: Role[],
  input: Omit<NotifyInput, 'userId'>,
  opts?: { governorate?: string | null }
) {
  try {
    const recipients = await prisma.user.findMany({
      where: {
        role: { in: roles as any },
        ...(opts?.governorate ? { governorate: opts.governorate } : {}),
      },
      select: { id: true },
    });
    if (recipients.length === 0) return;
    await prisma.notification.createMany({
      data: recipients.map((r) => ({
        userId: r.id,
        title: input.title,
        body: input.body || null,
        type: input.type || 'GENERAL',
        link: input.link || null,
      })),
    });
  } catch (err) {
    console.error('notifyRoles failed:', err);
  }
}

export const ADMIN_NOTIFY_ROLES = ALL_ADMIN_ROLES.filter(
  (r) => r === 'SUPER_ADMIN' || r === 'VOLUNTEER_MANAGER'
) as Role[];
