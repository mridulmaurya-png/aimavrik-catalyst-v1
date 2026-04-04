import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Root protection: Redirect logged-in users from / to /dashboard
  if (user && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow public auth routes without interference from dashboard protections
  const publicAuthRoutes = ["/login", "/signup", "/reset-password", "/auth/callback", "/auth/update-password"];
  if (publicAuthRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    // Optionally redirect logged-in users away from login/signup
    if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup")) {
       return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }

  // App protection for dashboard and functional routes
  const protectedRoutes = ["/dashboard", "/contacts", "/playbooks", "/integrations", "/settings", "/billing", "/analytics", "/event-logs"];
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  if (isProtectedRoute || request.nextUrl.pathname.startsWith("/onboarding")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Check if user has a business workspace for protected dashboard routes
    const { data: membership } = await supabase
      .from("team_members")
      .select("business_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    const hasWorkspace = !!membership?.business_id;

    if (!hasWorkspace && !request.nextUrl.pathname.startsWith("/onboarding")) {
       return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    if (hasWorkspace) {
       // Evaluate precise onboarding completion barrier
       const { data: completedLog } = await supabase
         .from("audit_logs")
         .select("id")
         .eq("business_id", membership.business_id)
         .eq("log_type", "ONBOARDING_COMPLETED")
         .limit(1)
         .maybeSingle();

       const isOnboardingComplete = !!completedLog;

       if (!isOnboardingComplete && !request.nextUrl.pathname.startsWith("/onboarding")) {
          // Force back to onboarding if they haven't finished yet!
          return NextResponse.redirect(new URL("/onboarding", request.url));
       }

       if (isOnboardingComplete && request.nextUrl.pathname.startsWith("/onboarding")) {
          // Avoid letting finished users return to wizard
          return NextResponse.redirect(new URL("/dashboard", request.url));
       }
    }

    return response;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
