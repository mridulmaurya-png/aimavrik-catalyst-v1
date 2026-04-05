import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";
  const error = requestUrl.searchParams.get("error");
  const error_description = requestUrl.searchParams.get("error_description");

  // 1. Check if Supabase sent an error in the query (e.g. expired link)
  if (error || error_description) {
    console.error("Auth callback error param:", error, error_description);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error_description || "Verification link expired or invalid. Please try again.")}`, request.url));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // This can be ignored if setAll is called during a redirect
          }
        },
      },
    }
  );

  // 2. Exchange code for session if present
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      console.error("Auth callback exchange error:", exchangeError.message);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Verification link expired or invalid. Please try again.")}`, request.url));
    }
  }

  // 3. After exchange (or if session already exists), get user
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // 4. Handle specific next destinations (like update-password)
    if (next && next !== "/dashboard") {
      // Basic safety: Ensure 'next' is a path, not a full malicious URL
      const safeNext = next.startsWith('/') ? next : `/${next}`;
      return NextResponse.redirect(new URL(safeNext, request.url));
    }

    // 5. Default Lifecycle Routing (Signups/Logins)
    const { data: membership } = await supabase
      .from("team_members")
      .select("business_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (membership?.business_id) {
       return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
       return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  // 6. Fail-safe: No user session found and no code to exchange
  // If we came here from a hash-token flow, the server wouldn't see it.
  // We'll redirect to login. The client-side might still catch it if we were on a page.
  return NextResponse.redirect(new URL("/login", request.url));
}
