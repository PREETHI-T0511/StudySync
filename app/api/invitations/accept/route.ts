import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { acceptGroupInvitation } from "@/lib/invitations";
import { errorResponse, readJsonObject, requiredString } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let connection: Awaited<ReturnType<ReturnType<typeof getPool>["getConnection"]>> | undefined;
  try {
    const user = await requireUser();
    const body = await readJsonObject(request);
    const token = requiredString(body, "token", 64)!;
    connection = await getPool().getConnection();
    await connection.beginTransaction();
    const invitation = await acceptGroupInvitation(
      connection,
      token,
      user.studentId,
      user.email,
    );
    await connection.commit();
    return NextResponse.json({ success: true, ...invitation });
  } catch (error) {
    if (connection) await connection.rollback();
    return errorResponse(error);
  } finally {
    connection?.release();
  }
}
