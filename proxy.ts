import { type NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/login" ||
    pathname.startsWith("/api/nedarim") ||
    pathname.startsWith("/api/logout")
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get("bm_session");
  if (!session?.value) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Send the landing URL straight to the first screen instead of rendering a
  // page whose only job is to redirect.
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/exams";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
