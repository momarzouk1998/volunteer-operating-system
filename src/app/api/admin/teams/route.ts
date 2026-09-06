import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET() {
  const gate = await requireRole(['SUPER_ADMIN', 'VOLUNTEER_MANAGER']);
  if (!gate.ok) return gate.res;
  const items = await prisma.team.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({ success: true, items });
}

export async function POST(request: Request) {
  const gate = await requireRole(['SUPER_ADMIN']);
  if (!gate.ok) return gate.res;
  const b = await request.json();
  if (!b.name?.trim()) return NextResponse.json({ error: 'اسم الفريق مطلوب' }, { status: 400 });
  try {
    const item = await prisma.team.create({
      data: {
        name: b.name.trim(),
        governorate: b.governorate || 'الجيزة',
        leaderName: b.leaderName || null,
        deputyName: b.deputyName || null,
        description: b.description || null,
      },
    });
    return NextResponse.json({ success: true, item });
  } catch {
    return NextResponse.json({ error: 'الفريق موجود مسبقاً' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const gate = await requireRole(['SUPER_ADMIN']);
  if (!gate.ok) return gate.res;
  const b = await request.json();
  if (!b.id) return NextResponse.json({ error: 'حدّد السجل' }, { status: 400 });
  const item = await prisma.team.update({
    where: { id: b.id },
    data: {
      name: b.name?.trim(),
      governorate: b.governorate,
      leaderName: b.leaderName ?? null,
      deputyName: b.deputyName ?? null,
      description: b.description ?? null,
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
  const team = await prisma.team.findUnique({ where: { id } });
  if (team) {
    const inUse = await prisma.user.count({ where: { teamName: team.name } });
    if (inUse > 0) {
      return NextResponse.json({ error: `لا يمكن الحذف: ${inUse} متطوع مرتبط بهذا الفريق` }, { status: 400 });
    }
  }
  await prisma.team.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
