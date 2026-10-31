import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { env, isSupabaseConfigured } from '@/lib/env';

const PUBLIC_ADMIN = ['/admin/login', '/admin/forgot', '/admin/auth/callback'];

export async function middleware(request: NextRequest) {
  const url = env.supabaseUrl;
  const key = env.supabasePublicKey;
  if (!isSupabaseConfigured()) return NextResponse.next(); // the admin pages explain what's missing

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (!user && !PUBLIC_ADMIN.some((p) => path.startsWith(p))) {
    const login = request.nextUrl.clone();
    login.pathname = '/admin/login';
    login.search = path !== '/admin' ? `?next=${encodeURIComponent(path + request.nextUrl.search)}` : '';
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
