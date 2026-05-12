import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function createClient() {
  const cookieStore = await cookies();
  const cookieMethods: CookieMethodsServer = {
    getAll() { return cookieStore.getAll(); },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      } catch {
        // Thrown in Server Components where cookies are read-only — safe to ignore
      }
    },
  };
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieMethods }
  );
}

/**
 * getUser that never throws.
 * Pass an existing client to avoid creating a second one per request.
 * Returns null on expired/invalid session and clears auth cookies.
 */
export async function safeGetUser(client?: SupabaseClient) {
  const cookieStore = await cookies();
  const supabase = client ?? (await createClient());

  const clearAuthCookies = () => {
    try {
      cookieStore.getAll()
        .filter(c => c.name.startsWith("sb-"))
        .forEach(c => cookieStore.set(c.name, "", { maxAge: 0, path: "/" }));
    } catch {
      // read-only context — ignore
    }
  };

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      const code = (error as { code?: string }).code;
      if (code === "refresh_token_not_found" || error.message?.includes("Refresh Token")) {
        clearAuthCookies();
      }
      return null;
    }
    return user;
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "refresh_token_not_found") clearAuthCookies();
    return null;
  }
}
