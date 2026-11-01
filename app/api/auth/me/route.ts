import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ student: await requireUser() });
  } catch (error) {
    return errorResponse(error);
  }
}
