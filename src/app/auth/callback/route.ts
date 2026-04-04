import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

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
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );

  let exchanged = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Auth callback exchange error:", error.message);
    } else {
      exchanged = true;
    }
  }

  // Attempt to parse user if present, validating their session works natively regardless of code
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  console.log("Auth callback results:", { hasCode: !!code, exchanged, hasUser: !!user, userError: userError?.message });

  if (user) {
    // If the user is authenticated, we route automatically
    const { data: membership } = await supabase
      .from("team_members")
      .select("business_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    console.log("Auth redirecting. Has DB Workspace?:", !!membership);

    if (membership) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  // Fallback to error log route
  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Verification link expired or invalid. Please log in.")}`, request.url));
}
