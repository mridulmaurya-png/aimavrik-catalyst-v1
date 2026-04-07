import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "@/lib/auth/admin";

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

  const adminProtectedRoutes = ["/ops"];
  const tenantProtectedRoutes = [
    "/dashboard", 
    "/contacts", 
    "/segments", 
    "/playbooks", 
    "/campaigns", 
    "/integrations", 
    "/analytics", 
    "/billing", 
    "/settings", 
    "/event-logs", 
    "/onboarding"
  ];
  
  const isAdminPath = adminProtectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  const isTenantPath = tenantProtectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  const isProtectedRoute = isAdminPath || isTenantPath;

  const publicAuthRoutes = ["/login", "/signup", "/reset-password", "/auth/callback", "/auth/update-password"];
  const isPublicAuthRoute = publicAuthRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // 1. Not logged in -> Redirect to login
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Logged in logic
  if (user) {
    const isAdmin = isAdminEmail(user.email);

    // 2a. Admin accessing tenant routes OR root -> Redirect to /ops/workspaces
    if (isAdmin) {
      if (isTenantPath || request.nextUrl.pathname === "/" || (isPublicAuthRoute && !request.nextUrl.pathname.startsWith("/auth/update-password"))) {
        return NextResponse.redirect(new URL("/ops/workspaces", request.url));
      }
    } 
    // 2b. Non-admin accessing admin routes -> Redirect to /dashboard
    else {
      if (isAdminPath) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      
      // 2c. Non-admin on public auth routes (except update-password) or root -> Redirect to /dashboard
      if (request.nextUrl.pathname === "/" || (isPublicAuthRoute && !request.nextUrl.pathname.startsWith("/auth/update-password"))) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
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
