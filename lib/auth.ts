import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { HttpError } from "@/lib/http";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/session-token";

export type AuthUser = {
  studentId: number;
  studentName: string;
  email: string;
  department: string | null;
  semester: number | null;
  cgpa: number | null;
};

type UserRow = RowDataPacket & {
  student_id: number;
  student_name: string;
  email: string;
  department: string | null;
  semester: number | null;
  cgpa: number | string | null;
};

function hashSessionId(sessionId: string): string {
  return createHash("sha256").update(sessionId).digest("hex");
}

export async function createSession(studentId: number, rememberMe: boolean) {
  const lifetimeSeconds = rememberMe ? 30 * 24 * 60 * 60 : 12 * 60 * 60;
  const expiresAt = Math.floor(Date.now() / 1000) + lifetimeSeconds;
  const sessionId = randomBytes(32).toString("hex");
  const token = await createSessionToken({
    sub: studentId,
    jti: sessionId,
    exp: expiresAt,
  });

  await getPool().execute(
    "INSERT INTO STUDENT_SESSION (session_id, student_id, expires_at) VALUES (?, ?, ?)",
    [hashSessionId(sessionId), studentId, new Date(expiresAt * 1000)],
  );

  return { token, expiresAt };
}

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const claims = await verifySessionToken(token);
  if (!claims) return null;

  const [rows] = await getPool().execute<UserRow[]>(
    `SELECT
      s.student_id,
      s.student_name,
      s.email,
      s.department,
      s.semester,
      s.cgpa
    FROM STUDENT_SESSION AS session
    JOIN STUDENT AS s ON s.student_id = session.student_id
    WHERE session.session_id = ?
      AND session.student_id = ?
      AND session.expires_at > CURRENT_TIMESTAMP`,
    [hashSessionId(claims.jti), claims.sub],
  );
  const user = rows[0];
  if (!user) return null;

  return {
    studentId: user.student_id,
    studentName: user.student_name,
    email: user.email,
    department: user.department,
    semester: user.semester,
    cgpa: user.cgpa === null ? null : Number(user.cgpa),
  };
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getAuthenticatedUser();
  if (!user) throw new HttpError(401, "Authentication is required.");
  return user;
}

export async function revokeCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return;

  const claims = await verifySessionToken(token);
  if (!claims) return;

  await getPool().execute(
    "DELETE FROM STUDENT_SESSION WHERE session_id = ? AND student_id = ?",
    [hashSessionId(claims.jti), claims.sub],
  );
}

export async function requireGroupMembership(groupId: number, user: AuthUser) {
  const [rows] = await getPool().execute<
    (RowDataPacket & { created_by: number | null; role: string | null })[]
  >(
    `SELECT g.created_by, gm.role
    FROM \`GROUP\` AS g
    LEFT JOIN GROUP_MEMBER AS gm
      ON gm.group_id = g.group_id AND gm.student_id = ?
    WHERE g.group_id = ?`,
    [user.studentId, groupId],
  );

  const group = rows[0];
  if (!group) throw new HttpError(404, "Group not found.");
  if (group.created_by !== user.studentId && !group.role) {
    throw new HttpError(403, "You are not a member of this group.");
  }

  return {
    isLeader: group.created_by === user.studentId || group.role?.toLowerCase() === "leader",
  };
}

export async function requireGroupLeader(groupId: number, user: AuthUser) {
  const access = await requireGroupMembership(groupId, user);
  if (!access.isLeader) throw new HttpError(403, "Only a group leader can perform this action.");
  return access;
}
