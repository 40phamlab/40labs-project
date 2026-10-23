import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Check if host is core subdomain (e.g. core.40labs.com or core.localhost)
  const isCoreSubdomain = hostname.startsWith('core.') || hostname.includes('core.localhost');

  if (isCoreSubdomain) {
    if (!pathname.startsWith('/core-site')) {
      url.pathname = `/core-site${pathname === '/' ? '' : pathname}`;
      return NextResponse.rewrite(url);
    }
  } else {
    // On main company domain, block direct access to /core-site
    if (pathname.startsWith('/core-site')) {
      return new NextResponse('Not Found', { status: 404 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
