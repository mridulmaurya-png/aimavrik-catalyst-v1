import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const redirectTo = new URL(request.url);

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

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Auth callback exchange error:", error.message);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Verification link expired or invalid. Please try again.")}`, request.url));
    }
  }

  // After exchange, check session status
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // 1. If 'next' is explicitly provided (Password Resets, Magic Links), prioritize it
    if (next) {
      return NextResponse.redirect(new URL(next, request.url));
    }

    // 2. Default Lifecycle Routing (Signups)
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

  // Final Fallback
  return NextResponse.redirect(new URL("/login", request.url));
}
