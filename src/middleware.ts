import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRouteConfig } from "./utils/routeConfig";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get("auth-token");
  const isAuthenticated = authToken !== undefined;
  const onboardingCookie = request.cookies.get("onboarding-complete");
  const isOnboardingComplete = onboardingCookie?.value === "true";

  const routeConfig = getRouteConfig(pathname);

  if (!routeConfig) {
    return NextResponse.next();
  }

  if (routeConfig.protected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (routeConfig.redirectIfAuthenticated && isAuthenticated) {
    if (isOnboardingComplete) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (isAuthenticated) {
    if (pathname === "/onboarding") {
      if (isOnboardingComplete) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } else if (!isOnboardingComplete) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/verification",
    "/onboarding/:path*",
    "/dashboard/:path*",
  ],
};
