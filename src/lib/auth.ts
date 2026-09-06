import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from './prisma';
import type { Role } from './rbac';
import { isScopedRole } from './rbac';

export const JWT_SECRET_STR = process.env.JWT_SECRET || 'vos-secret-key-2026-khwater-ahla-shabab';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STR);
export const AUTH_COOKIE = 'vos_token';

export interface TokenPayload {
  userId: string;
  phone: string;
  name: string;
  role: string;
  volunteerCode?: string | null;
}

export function normalizePhone(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-\(\)]/g, '').trim();
  // إذا كان يبدأ بـ 0020
  if (cleaned.startsWith('0020')) {
    cleaned = '+20' + cleaned.substring(4);
  }
  // إذا كان يبدأ بـ 20
  else if (cleaned.startsWith('20') && !cleaned.startsWith('+20')) {
    cleaned = '+' + cleaned;
  }
  // إذا كان مصري 01xxxxxxxxx
  else if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '+2' + cleaned;
  }
  return cleaned;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || !payload.userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        volunteerCode: true,
        avatarUrl: true,
        governorate: true,
        status: true,
        level: true,
        totalHours: true,
        totalPoints: true,
        rating: true,
        teamName: true,
      },
    });
    return user;
  } catch (err) {
    return null;
  }
}

type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export type RoleGate =
  | { ok: true; user: CurrentUser }
  | { ok: false; res: NextResponse };

/**
 * حارس صلاحيات لمسارات الـ API — يُفحص على الخادم لا على الواجهة.
 * الاستخدام:  const gate = await requireRole(['SUPER_ADMIN']); if (!gate.ok) return gate.res;
 */
export async function requireRole(roles: Role[] | 'ANY_AUTH'): Promise<RoleGate> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, res: NextResponse.json({ error: 'غير مصرح، يجب تسجيل الدخول' }, { status: 401 }) };
  }
  if (roles !== 'ANY_AUTH' && !roles.includes(user.role as Role)) {
    return { ok: false, res: NextResponse.json({ error: 'ليس لديك صلاحية لهذا الإجراء' }, { status: 403 }) };
  }
  return { ok: true, user };
}

/**
 * قيد نطاق المحافظة: مسؤول المحافظة وقائد الفريق يريان محافظتهم فقط.
 * يعيد شرط where جزئي يُدمج مع بقية الفلاتر.
 */
export function governorateScope(user: { role: string; governorate?: string | null }) {
  if (isScopedRole(user.role) && user.governorate) {
    return { governorate: user.governorate };
  }
  return {};
}
