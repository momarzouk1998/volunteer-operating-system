import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { pageRolesFor, landingPathFor } from '@/lib/rbac';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'vos-secret-key-2026-khwater-ahla-shabab'
);

async function verifyJwt(token: string): Promise<any | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('vos_token')?.value;
  const payload = token ? await verifyJwt(token) : null;

  if (!payload) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  const role = payload.role as string | undefined;
  const allowedRoles = pageRolesFor(pathname);

  if (allowedRoles && (!role || !allowedRoles.includes(role as any))) {
    const url = req.nextUrl.clone();
    url.pathname = landingPathFor(role);
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|login|apply|verify).*)',
  ],
};
