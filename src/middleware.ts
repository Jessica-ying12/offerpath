import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/learn",
  "/practice",
  "/sprint",
  "/career",
  "/interview",
  "/records",
  "/profile",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) return NextResponse.next();
  if (request.cookies.get(SESSION_COOKIE)?.value) return NextResponse.next();
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding",
    "/learn/:path*",
    "/practice/:path*",
    "/sprint/:path*",
    "/career/:path*",
    "/interview/:path*",
    "/records/:path*",
    "/profile",
  ],
};
