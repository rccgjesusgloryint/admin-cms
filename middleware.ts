import { auth } from "@/auth";
import { hasPermission, isAdminRole } from "@/lib/permissions";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.member;

  // Allow public access to root landing page and login
  const publicRoutes = ["/", "/login"];
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  // Protect all routes except public routes
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Redirect logged-in users away from login page
  if (isLoggedIn && nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Check if user is trying to access dashboard routes
  if (nextUrl.pathname.startsWith("/dashboard")) {
    // First check if user has any admin role
    if (!userRole || !isAdminRole(userRole)) {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }

    // Check granular permissions for the specific route
    if (!hasPermission(userRole, nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
