import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  if (process.env.TOPICOS_VIEW === 'v2') {
    const url = req.nextUrl;
    const { pathname, searchParams } = url;

    // Bandera de escape para evitar bucles cuando v2 llama a v1
    const skip = searchParams.get('__skipRewrite') === '1';

    if (!skip && (pathname === '/api/topicos' || pathname.startsWith('/api/topicos/'))) {
      const rewriteURL = url.clone();
      rewriteURL.pathname = '/api/topicos/v2';
      return NextResponse.rewrite(rewriteURL);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/topicos', '/api/topicos/:path*'],
};
