import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              maxAge: 60 * 60 * 24 * 30,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
            })
          );
        },
      },
    }
  );

  const { pathname } = request.nextUrl;

  // bypass proxy สำหรับ OAuth callback — แต่ยังต้องผ่าน supabase ก่อนเพื่อ set cookies
  if (pathname.startsWith("/auth/")) {
    await supabase.auth.getUser();
    return supabaseResponse;
  }

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error?.code === "refresh_token_not_found" || error?.status === 400) {
      await supabase.auth.signOut();
    } else {
      user = data.user;
    }
  } catch {
    // ignore — treat as unauthenticated
  }

  // ถ้า login แล้วเข้าหน้า auth → redirect ไป /
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
