import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAdmin =
    req.auth?.user?.member === "ADMIN" || req.auth?.user?.member === "OWNER";

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
    // Allow access to unauthorized page
    if (
      nextUrl.pathname === "/dashboard" ||
      nextUrl.pathname.startsWith("/dashboard")
    ) {
      // Redirect non-admin users to unauthorized page
      if (!isAdmin && nextUrl.pathname !== "/unauthorized") {
        console.log("isAdmin", req.auth?.user);
        return NextResponse.redirect(new URL("/unauthorized", nextUrl));
      }
    }
  }

  return NextResponse.next();
});
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
