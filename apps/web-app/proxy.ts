import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function resolveSite(hostHeader: string | null | undefined): 'core' | 'company' {
  if (!hostHeader || typeof hostHeader !== 'string') {
    return 'company';
  }

  // Normalize host: lowercase, remove trailing dot if present, strip port if present
  let cleanHost = hostHeader.trim().toLowerCase();

  if (cleanHost.endsWith('.')) {
    cleanHost = cleanHost.slice(0, -1);
  }

  const colonIndex = cleanHost.lastIndexOf(':');
  if (colonIndex !== -1 && !cleanHost.includes(']')) {
    cleanHost = cleanHost.slice(0, colonIndex);
  } else if (colonIndex !== -1 && cleanHost.includes(']')) {
    const bracketClose = cleanHost.indexOf(']');
    if (colonIndex > bracketClose) {
      cleanHost = cleanHost.slice(0, colonIndex);
    }
  }

  if (
    cleanHost === 'core.localhost' ||
    cleanHost === 'core.40labs.com' ||
    cleanHost.endsWith('.core.localhost') ||
    cleanHost.endsWith('.core.40labs.com')
  ) {
    return 'core';
  }

  return 'company';
}

export function proxy(request: NextRequest) {
  // Honour x-forwarded-host if present, else request.headers.get('host')
  const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const site = resolveSite(hostHeader);
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  if (site === 'core') {
    if (!pathname.startsWith('/core-site')) {
      url.pathname = `/core-site${pathname === '/' ? '' : pathname}`;
      return NextResponse.rewrite(url);
    }
  } else {
    // Company site: block direct access to /core-site on company host (404)
    if (pathname.startsWith('/core-site')) {
      return new NextResponse('Not Found', { status: 404 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
