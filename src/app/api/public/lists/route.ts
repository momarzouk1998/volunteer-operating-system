import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// قوائم عامة لصفحة التقديم (بلا تسجيل دخول) — أسماء المحافظات فقط
export async function GET() {
  try {
    const govs = await prisma.governorate.findMany({ orderBy: { name: 'asc' }, select: { name: true } });
    return NextResponse.json({ success: true, governorates: govs.map((g) => g.name) });
  } catch {
    return NextResponse.json({ success: true, governorates: [] });
  }
}
