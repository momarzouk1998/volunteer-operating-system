import { NextRequest, NextResponse } from 'next/server';
import { pageRolesFor, landingPathFor } from '@/lib/rbac';

const JWT_SECRET = process.env.JWT_SECRET || 'vos-secret-key-2026-khwater-ahla-shabab';

// ---- تحقق HS256 من التوكن باستخدام Web Crypto (متوافق مع Edge runtime) ----
function b64urlToUint8(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const b64 = (input + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

async function verifyJwt(token: string): Promise<any | null> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET) as unknown as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlToUint8(signatureB64) as unknown as BufferSource,
      new TextEncoder().encode(`${headerB64}.${payloadB64}`) as unknown as BufferSource
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(b64urlToUint8(payloadB64)));
    if (payload.exp && Date.now() >= payload.exp * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('vos_token')?.value;
  const payload = token ? await verifyJwt(token) : null;

  // غير مسجّل → صفحة الدخول
  if (!payload) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  const role = payload.role as string | undefined;
  const allowedRoles = pageRolesFor(pathname);

  // صفحة مقيّدة بأدوار لا يملكها المستخدم
  if (allowedRoles && (!role || !allowedRoles.includes(role as any))) {
    const url = req.nextUrl.clone();
    url.pathname = landingPathFor(role);
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // كل المسارات ما عدا الـ API، ملفات Next الثابتة، الأصول، والصفحات العامة
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|login|apply|verify).*)',
  ],
};
