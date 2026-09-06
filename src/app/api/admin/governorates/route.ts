import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET() {
  const gate = await requireRole(['SUPER_ADMIN', 'VOLUNTEER_MANAGER']);
  if (!gate.ok) return gate.res;
  const items = await prisma.governorate.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({ success: true, items });
}

export async function POST(request: Request) {
  const gate = await requireRole(['SUPER_ADMIN']);
  if (!gate.ok) return gate.res;
  const b = await request.json();
  if (!b.name?.trim()) return NextResponse.json({ error: 'اسم المحافظة مطلوب' }, { status: 400 });
  try {
    const item = await prisma.governorate.create({
      data: {
        name: b.name.trim(),
        leaderName: b.leaderName || null,
        deputyName: b.deputyName || null,
        targetHours: Number(b.targetHours) || 1000,
      },
    });
    return NextResponse.json({ success: true, item });
  } catch {
    return NextResponse.json({ error: 'المحافظة موجودة مسبقاً' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const gate = await requireRole(['SUPER_ADMIN']);
  if (!gate.ok) return gate.res;
  const b = await request.json();
  if (!b.id) return NextResponse.json({ error: 'حدّد السجل' }, { status: 400 });
  const item = await prisma.governorate.update({
    where: { id: b.id },
    data: {
      name: b.name?.trim(),
      leaderName: b.leaderName ?? null,
      deputyName: b.deputyName ?? null,
      targetHours: b.targetHours !== undefined ? Number(b.targetHours) : undefined,
    },
  });
  return NextResponse.json({ success: true, item });
}

export async function DELETE(request: Request) {
  const gate = await requireRole(['SUPER_ADMIN']);
  if (!gate.ok) return gate.res;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'حدّد السجل' }, { status: 400 });
  const gov = await prisma.governorate.findUnique({ where: { id } });
  if (gov) {
    const inUse = await prisma.user.count({ where: { governorate: gov.name } });
    if (inUse > 0) {
      return NextResponse.json({ error: `لا يمكن الحذف: ${inUse} متطوع مرتبط بهذه المحافظة` }, { status: 400 });
    }
  }
  await prisma.governorate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
