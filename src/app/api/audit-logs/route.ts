import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const gate = await requireRole(['SUPER_ADMIN']);
    if (!gate.ok) return gate.res;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || '';
    const entity = searchParams.get('entity') || '';
    const search = (searchParams.get('search') || '').trim();
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '30', 10) || 30));

    const where: any = {};
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (search) {
      where.OR = [
        { userName: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(`${to}T23:59:59`);
    }

    const [logs, total, actions, entities] = await Promise.all([
      prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({ distinct: ['action'], select: { action: true }, orderBy: { action: 'asc' } }),
      prisma.auditLog.findMany({ distinct: ['entity'], select: { entity: true }, orderBy: { entity: 'asc' } }),
    ]);

    return NextResponse.json({
      success: true,
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      actions: actions.map((a) => a.action),
      entities: entities.map((e) => e.entity),
    });
  } catch (err: any) {
    console.error('Error fetching audit logs:', err);
    return NextResponse.json({ error: 'خطأ في جلب سجل التدقيق' }, { status: 500 });
  }
}
