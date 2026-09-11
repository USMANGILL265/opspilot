import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/health',
  '/api/docs',
  '/api/openapi.json',
];

const PROTECTED_PAGES = [
  '/dashboard',
  '/tasks',
  '/customers',
  '/products',
  '/tickets',
  '/search',
  '/audit-logs',
  '/settings',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  // Create cloned request headers to attach correlation ID
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  // 1. Handle Protected Dashboard Pages
  const isProtectedPage = PROTECTED_PAGES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  const sessionCookie = request.cookies.get('opspilot_session');

  if (isProtectedPage && !sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Handle Protected API Routes
  const isApiRoute = pathname.startsWith('/api/');
  const isPublicApi = PUBLIC_API_ROUTES.some((publicPath) => pathname === publicPath || pathname.startsWith(publicPath));

  if (isApiRoute && !isPublicApi) {
    const authHeader = request.headers.get('authorization');
    const hasBearer = authHeader && authHeader.startsWith('Bearer ');
    const hasCookie = !!sessionCookie?.value;

    if (!hasBearer && !hasCookie) {
      const response = NextResponse.json(
        { success: false, error: 'Unauthorized: Session or Bearer token missing' },
        { status: 401 }
      );
      applySecurityHeaders(response, requestId);
      return response;
    }
  }

  // 3. Continue with Request and apply Security Headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  applySecurityHeaders(response, requestId);
  return response;
}

function applySecurityHeaders(response: NextResponse, requestId: string) {
  response.headers.set('X-Request-Id', requestId);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  );
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (robots.txt, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
