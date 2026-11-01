import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireGroupLeader, requireGroupMembership, requireUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
import {
  errorResponse,
  HttpError,
  positiveInteger,
  readJsonObject,
  requiredString,
  validDate,
  validTime,
} from "@/lib/http";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ meetingId: string }> };

async function meetingGroup(meetingId: number) {
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
    const groupId = await meetingGroup(meetingId);
    await requireGroupMembership(groupId, user);
    const [meeting] = await getPool().execute<RowDataPacket[]>(
      `SELECT m.meeting_id AS meetingId, m.group_id AS groupId,
        m.meeting_title AS meetingTitle, m.meeting_date AS meetingDate,
        m.start_time AS startTime, m.end_time AS endTime,
        m.meeting_location AS meetingLocation
      FROM MEETING AS m WHERE m.meeting_id = ?`,
      [meetingId],
    );
    const [agenda] = await getPool().execute<RowDataPacket[]>(
      `SELECT agenda_id AS agendaId, agenda_title AS agendaTitle,
        agenda_description AS agendaDescription
      FROM MEETING_AGENDA WHERE meeting_id = ? ORDER BY agenda_id`,
      [meetingId],
    );
    const [participants] = await getPool().execute<RowDataPacket[]>(
      `SELECT mp.student_id AS studentId, s.student_name AS studentName,
        s.email, mp.attendance_status AS attendanceStatus
      FROM MEETING_PARTICIPANT AS mp
      JOIN STUDENT AS s ON s.student_id = mp.student_id
      WHERE mp.meeting_id = ? ORDER BY s.student_name`,
      [meetingId],
    );
    return NextResponse.json({ meeting: meeting[0], agenda, participants });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const meetingId = positiveInteger((await context.params).meetingId, "meetingId");
    const groupId = await meetingGroup(meetingId);
    await requireGroupLeader(groupId, user);
    const body = await readJsonObject(request);
    const title = requiredString(body, "meetingTitle", 150)!;
    const meetingDate = validDate(body.meetingDate, "meetingDate")!;
    const startTime = validTime(body.startTime, "startTime");
    const endTime = validTime(body.endTime, "endTime");
    const location =
      typeof body.meetingLocation === "string" && body.meetingLocation.trim()
        ? body.meetingLocation.trim().slice(0, 150)
        : null;
    if (endTime <= startTime) throw new HttpError(400, "endTime must be later than startTime.");
    if (meetingDate < new Date().toISOString().slice(0, 10)) {
      throw new HttpError(400, "meetingDate cannot be in the past.");
    }
    await getPool().execute(
      `UPDATE MEETING SET meeting_title = ?, meeting_date = ?,
        start_time = ?, end_time = ?, meeting_location = ?
      WHERE meeting_id = ?`,
      [title, meetingDate, startTime, endTime, location, meetingId],
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  let connection: Awaited<ReturnType<ReturnType<typeof getPool>["getConnection"]>> | undefined;
  try {
    const user = await requireUser();
    const meetingId = positiveInteger((await context.params).meetingId, "meetingId");
    const groupId = await meetingGroup(meetingId);
    await requireGroupLeader(groupId, user);
    connection = await getPool().getConnection();
    await connection.beginTransaction();
    await connection.execute("DELETE FROM MEETING_AGENDA WHERE meeting_id = ?", [meetingId]);
    await connection.execute("DELETE FROM MEETING_PARTICIPANT WHERE meeting_id = ?", [meetingId]);
    await connection.execute("DELETE FROM MEETING WHERE meeting_id = ?", [meetingId]);
    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (connection) await connection.rollback();
    return errorResponse(error);
  } finally {
    connection?.release();
  }
}
