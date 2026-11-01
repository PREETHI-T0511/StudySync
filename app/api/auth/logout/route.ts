import { NextResponse } from "next/server";
import { revokeCurrentSession } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { SESSION_COOKIE_NAME } from "@/lib/session-token";

export const runtime = "nodejs";

export async function POST() {
  try {
    await revokeCurrentSession();
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
