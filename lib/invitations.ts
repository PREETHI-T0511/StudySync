import { createHash } from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { HttpError } from "@/lib/http";

type InvitationRow = RowDataPacket & {
  group_id: number;
  group_name: string;
  invited_email: string;
  expires_at: Date | string;
};

export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function acceptGroupInvitation(
  connection: PoolConnection,
  token: string,
  studentId: number,
  email: string,
) {
  if (!/^[a-f0-9]{64}$/.test(token)) {
    throw new HttpError(400, "The invitation link is invalid.");
  }

  const [rows] = await connection.execute<InvitationRow[]>(
    `SELECT invitation.group_id, invitation.invited_email,
      invitation.expires_at, \`GROUP\`.group_name
    FROM GROUP_INVITATION AS invitation
    JOIN \`GROUP\` ON \`GROUP\`.group_id = invitation.group_id
    WHERE invitation.invitation_token_hash = ?
    FOR UPDATE`,
    [hashInvitationToken(token)],
  );
  const invitation = rows[0];
  if (!invitation || new Date(invitation.expires_at).getTime() <= Date.now()) {
    throw new HttpError(410, "This invitation link has expired or was already used.");
  }
  if (invitation.invited_email.toLowerCase() !== email.toLowerCase()) {
    throw new HttpError(403, "Sign in or create an account with the invited email address.");
  }

  await connection.execute(
    `INSERT INTO GROUP_MEMBER (group_id, student_id, role, joined_date)
    VALUES (?, ?, 'Member', CURRENT_DATE)`,
    [invitation.group_id, studentId],
  );
  await connection.execute(
    "DELETE FROM GROUP_INVITATION WHERE invitation_token_hash = ?",
    [hashInvitationToken(token)],
  );

  return { groupId: invitation.group_id, groupName: invitation.group_name };
}
