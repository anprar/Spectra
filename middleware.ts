import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SECRET = process.env.SESSION_SECRET || 'spectra_super_secret_session_key_12345';

// Base64url decode utility for middleware
function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const utf8 = binary.split('').map((c) => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join('');
  return decodeURIComponent(utf8);
}

// Convert string to array buffer
function str2ab(str: string): Uint8Array {
  const buf = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    buf[i] = str.charCodeAt(i);
  }
  return buf;
}

// Verify token in Middleware (Edge-friendly)
async function verifySession(token: string): Promise<any | null> {
  try {
    const [part1, part2, part3] = token.split('.');
    if (!part1 || !part2 || !part3) return null;
    
    const tokenToVerify = `${part1}.${part2}`;
    const keyData = str2ab(SECRET);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const sigStr = base64urlDecode(part3);
    const sigBuf = str2ab(sigStr);
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBuf,
      str2ab(tokenToVerify)
    );
    
    if (!isValid) return null;
    
    const payloadJson = base64urlDecode(part2);
    const payload = JSON.parse(payloadJson);
    
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    
    return payload;
  } catch (e) {
    return null;
  }
}

// Safely construct absolute redirect URLs based on headers (for proxy/public IP compatibility)
function getAbsoluteRedirectUrl(path: string, request: NextRequest): URL {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  return new URL(path, `${proto}://${host}`);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public files, static assets, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico' ||
    pathname === '/template_soal.xlsx'
  ) {
    return NextResponse.next();
  }

  // 2. Read the session cookie
  const token = request.cookies.get('spectra_session')?.value;
  const session = token ? await verifySession(token) : null;

  // 3. Handle login page redirect
  if (pathname === '/login' || pathname === '/') {
    if (session) {
      // Redirect logged-in users to their role dashboard
      const dashboardMap: Record<string, string> = {
        admin: '/admin',
        instructor: '/instructor',
        candidate: '/candidate',
      };
      const redirectUrl = getAbsoluteRedirectUrl(dashboardMap[session.role] || '/login', request);
      return NextResponse.redirect(redirectUrl);
    }
    
    if (pathname === '/') {
      // Redirect home page to login if not logged in
      return NextResponse.redirect(getAbsoluteRedirectUrl('/login', request));
    }
    
    return NextResponse.next();
  }

  // 4. Protect routes based on role
  if (!session) {
    // Not authenticated: Redirect to login
    const loginUrl = getAbsoluteRedirectUrl('/login', request);
    // If it's an API request, return a 401 JSON instead of a redirect
    if (pathname.startsWith('/api')) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized. Silakan login kembali.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return NextResponse.redirect(loginUrl);
  }

  // Enforce role-based access
  if (pathname.startsWith('/admin')) {
    if (pathname.startsWith('/admin/results')) {
      if (session.role !== 'admin' && session.role !== 'instructor') {
        return NextResponse.redirect(getAbsoluteRedirectUrl('/login', request));
      }
    } else if (session.role !== 'admin') {
      return NextResponse.redirect(getAbsoluteRedirectUrl('/login', request));
    }
  }

  if (pathname.startsWith('/instructor')) {
    if (session.role !== 'instructor' && session.role !== 'admin') {
      return NextResponse.redirect(getAbsoluteRedirectUrl('/login', request));
    }
  }

  if (pathname.startsWith('/candidate')) {
    if (session.role !== 'candidate' && session.role !== 'admin') {
      // Let admin inspect candidate screens, but redirect others
      return NextResponse.redirect(getAbsoluteRedirectUrl('/login', request));
    }
  }

  // Protect API routes
  if (pathname.startsWith('/api/admin')) {
    if (pathname.startsWith('/api/admin/results')) {
      if (session.role !== 'admin' && session.role !== 'instructor') {
        return new NextResponse(JSON.stringify({ error: 'Forbidden. Akses ditolak.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }
    } else if (session.role !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'Forbidden. Akses ditolak.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
  }

  if (pathname.startsWith('/api/instructor')) {
    if (session.role !== 'instructor' && session.role !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'Forbidden. Akses ditolak.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
  }

  if (pathname.startsWith('/api/candidate')) {
    if (session.role !== 'candidate' && session.role !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'Forbidden. Akses ditolak.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
  }

  return NextResponse.next();
}

// Apply middleware to specific routes
export const config = {
  matcher: [
    '/',
    '/login',
    '/admin/:path*',
    '/instructor/:path*',
    '/candidate/:path*',
    '/api/admin/:path*',
    '/api/instructor/:path*',
    '/api/candidate/:path*',
  ],
};
