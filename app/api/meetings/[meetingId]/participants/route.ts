import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireGroupLeader, requireGroupMembership, requireUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
import {
  errorResponse,
  HttpError,
  positiveInteger,
  readJsonObject,
} from "@/lib/http";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ meetingId: string }> };

async function groupForMeeting(meetingId: number) {
  const [rows] = await getPool().execute<
    (RowDataPacket & { group_id: number })[]
  >("SELECT group_id FROM MEETING WHERE meeting_id = ?", [meetingId]);
  if (!rows[0]) throw new HttpError(404, "Meeting not found.");
  return rows[0].group_id;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const meetingId = positiveInteger((await context.params).meetingId, "meetingId");
    const groupId = await groupForMeeting(meetingId);
    await requireGroupMembership(groupId, user);
    const [participants] = await getPool().execute<RowDataPacket[]>(
      `SELECT mp.student_id AS studentId, s.student_name AS studentName,
        s.email, mp.attendance_status AS attendanceStatus
      FROM MEETING_PARTICIPANT AS mp
      JOIN STUDENT AS s ON s.student_id = mp.student_id
      WHERE mp.meeting_id = ?
      ORDER BY s.student_name`,
      [meetingId],
    );
    return NextResponse.json({ participants });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const meetingId = positiveInteger((await context.params).meetingId, "meetingId");
    const groupId = await groupForMeeting(meetingId);
    await requireGroupLeader(groupId, user);
    const body = await readJsonObject(request);
    const studentId = positiveInteger(String(body.studentId ?? ""), "studentId");
    const [membership] = await getPool().execute<RowDataPacket[]>(
      "SELECT 1 FROM GROUP_MEMBER WHERE group_id = ? AND student_id = ?",
      [groupId, studentId],
    );
    if (!membership[0]) throw new HttpError(400, "Participant must belong to this group.");

    await getPool().execute(
      `INSERT INTO MEETING_PARTICIPANT (meeting_id, student_id, attendance_status)
      VALUES (?, ?, 'Invited')`,
      [meetingId, studentId],
    );
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
