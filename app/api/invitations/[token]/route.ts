import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { hashInvitationToken } from "@/lib/invitations";
import { errorResponse, HttpError } from "@/lib/http";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    if (!/^[a-f0-9]{64}$/.test(token)) {
      throw new HttpError(400, "The invitation link is invalid.");
    }
    const [rows] = await getPool().execute<
      (RowDataPacket & { groupName: string; email: string })[]
    >(
      `SELECT \`GROUP\`.group_name AS groupName,
        invitation.invited_email AS email
      FROM GROUP_INVITATION AS invitation
      JOIN \`GROUP\` ON \`GROUP\`.group_id = invitation.group_id
      WHERE invitation.invitation_token_hash = ?
        AND invitation.expires_at > CURRENT_TIMESTAMP`,
      [hashInvitationToken(token)],
    );
    if (!rows[0]) {
      throw new HttpError(410, "This invitation link has expired or was already used.");
    }
    return NextResponse.json({ invitation: rows[0] });
  } catch (error) {
    return errorResponse(error);
  }
}
