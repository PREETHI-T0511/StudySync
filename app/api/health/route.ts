import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { HttpError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    await getPool().query("SELECT 1");
    return NextResponse.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check failed:", error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { status: "error", database: "unavailable", error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { status: "error", database: "unavailable" },
      { status: 503 },
    );
  }
}
