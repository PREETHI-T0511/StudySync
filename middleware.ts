import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/session-token";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const claims = token ? await verifySessionToken(token) : null;
  const isWorkspace = request.nextUrl.pathname.startsWith("/workspace");

  if (isWorkspace && !claims) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (request.nextUrl.pathname === "/" && claims) {
    return NextResponse.redirect(new URL("/workspace", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/workspace/:path*"],
};
