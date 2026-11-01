import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireGroupLeader, requireGroupMembership, requireUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { hashInvitationToken } from "@/lib/invitations";
import {
  errorResponse,
  HttpError,
  positiveInteger,
  readJsonObject,
  requiredString,
} from "@/lib/http";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ groupId: string }> };
type MemberRow = RowDataPacket & {
  studentId: number;
  studentName: string;
  email: string;
  role: string;
  joinedDate: string | Date | null;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const groupId = positiveInteger((await context.params).groupId, "groupId");
    await requireGroupMembership(groupId, user);
    const [rows] = await getPool().execute<MemberRow[]>(
      `SELECT
        s.student_id AS studentId,
        s.student_name AS studentName,
        s.email,
        gm.role,
        gm.joined_date AS joinedDate
      FROM GROUP_MEMBER AS gm
      JOIN STUDENT AS s ON s.student_id = gm.student_id
      WHERE gm.group_id = ?
      ORDER BY CASE WHEN gm.role = 'Leader' THEN 0 ELSE 1 END, s.student_name`,
      [groupId],
    );
    return NextResponse.json({ members: rows });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const groupId = positiveInteger((await context.params).groupId, "groupId");
    await requireGroupLeader(groupId, user);
    const body = await readJsonObject(request);
    const email = requiredString(body, "email", 100)!.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError(400, "Enter a valid email address.");
    }
    const [students] = await getPool().execute<
      (RowDataPacket & { student_id: number })[]
    >("SELECT student_id FROM STUDENT WHERE email = ?", [email]);
    if (!students[0]) {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await getPool().execute(
        `INSERT INTO GROUP_INVITATION
          (group_id, invited_email, invitation_token_hash, invited_by, expires_at)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          invitation_token_hash = VALUES(invitation_token_hash),
          invited_by = VALUES(invited_by),
          expires_at = VALUES(expires_at)`,
        [groupId, email, hashInvitationToken(token), user.studentId, expiresAt],
      );
      const invitationUrl = `/create-account?invite=${token}`;
      return NextResponse.json({ invitationUrl, expiresAt }, { status: 201 });
    }

    await getPool().execute(
      `INSERT INTO GROUP_MEMBER (group_id, student_id, role, joined_date)
      VALUES (?, ?, 'Member', CURRENT_DATE)`,
      [groupId, students[0].student_id],
    );
    return NextResponse.json({ success: true, memberAdded: true }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
