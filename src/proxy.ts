import createI18nMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const handleI18nRouting = createI18nMiddleware(routing);

// Routes that require authentication
const protectedPaths = ["/dashboard"];
// Routes only for non-authenticated users
const authPaths = ["/login"];

// Extract locale prefix from pathname (e.g. "/en/dashboard" -> "en")
function getLocaleFromPath(pathname: string): string {
  const match = pathname.match(/^\/(en|es)(\/|$)/);
  return match?.[1] || "en";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check for API routes and static assets
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // Check for session cookie (optimistic check)
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  // Strip locale prefix to check path
  const pathWithoutLocale = pathname.replace(/^\/(en|es)/, "") || "/";
  const locale = getLocaleFromPath(pathname);

  const isProtectedRoute = protectedPaths.some((p) =>
    pathWithoutLocale.startsWith(p)
  );
  const isAuthRoute = authPaths.some((p) =>
    pathWithoutLocale.startsWith(p)
  );

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages to dashboard
  if (isAuthRoute && sessionToken) {
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
