import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // On Railway (and any reverse proxy), request.url has the internal origin.
  // Use x-forwarded-host + x-forwarded-proto to get the real public origin.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const publicOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin;

  if (code) {
    // Build the response early so we can set cookies on it
    const response = NextResponse.redirect(`${publicOrigin}${next}`);

    // In Route Handlers, read/write cookies via request/response directly —
    // not via cookies() from next/headers — so the PKCE verifier is found.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
    console.error("[auth/callback] exchangeCodeForSession error:", error);
  } else {
    console.error("[auth/callback] no code param, searchParams:", Object.fromEntries(searchParams));
  }

  return NextResponse.redirect(`${publicOrigin}/login?error=oauth`);
}
