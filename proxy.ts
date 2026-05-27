import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "sigma-admin-auth";
const SESSION_TOKEN = "sigma-air-authenticated";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (but NOT /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get(COOKIE_NAME);

    if (token?.value !== SESSION_TOKEN) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
