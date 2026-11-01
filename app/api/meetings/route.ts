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

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const groupIdParam = new URL(request.url).searchParams.get("groupId");
    let groupPredicate = "";
    if (groupIdParam) {
      const groupId = positiveInteger(groupIdParam, "groupId");
      await requireGroupMembership(groupId, user);
      groupPredicate = " AND m.group_id = ?";
    }
    const [rows] = await getPool().execute<RowDataPacket[]>(
      `SELECT m.meeting_id AS meetingId, m.group_id AS groupId,
        g.group_name AS groupName, m.meeting_title AS title,
        m.meeting_date AS meetingDate, m.start_time AS startTime,
        m.end_time AS endTime, m.meeting_location AS location,
        mp.attendance_status AS attendanceStatus
      FROM MEETING AS m
      JOIN \`GROUP\` AS g ON g.group_id = m.group_id
      JOIN GROUP_MEMBER AS viewer ON viewer.group_id = g.group_id AND viewer.student_id = ?
      LEFT JOIN MEETING_PARTICIPANT AS mp
        ON mp.meeting_id = m.meeting_id AND mp.student_id = ?
      WHERE 1 = 1${groupPredicate}
      ORDER BY m.meeting_date, m.start_time`,
      [user.studentId, user.studentId, ...(groupIdParam ? [positiveInteger(groupIdParam, "groupId")] : [])],
    );
    return NextResponse.json({ meetings: rows });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  let connection: Awaited<ReturnType<ReturnType<typeof getPool>["getConnection"]>> | undefined;
  try {
    connection = await getPool().getConnection();
    const user = await requireUser();
    const body = await readJsonObject(request);
    const groupId = positiveInteger(String(body.groupId ?? ""), "groupId");
    await requireGroupLeader(groupId, user);
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
    const agenda = body.agenda === undefined ? [] : body.agenda;
    if (!Array.isArray(agenda) || agenda.some((item) => typeof item !== "string" || !item.trim())) {
      throw new HttpError(400, "agenda must be an array of non-empty agenda titles.");
    }

    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO MEETING
        (group_id, meeting_title, meeting_date, start_time, end_time, meeting_location)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [groupId, title, meetingDate, startTime, endTime, location],
    );
    const meetingId = (result as { insertId: number }).insertId;
    await connection.execute(
      `INSERT INTO MEETING_PARTICIPANT (meeting_id, student_id, attendance_status)
      SELECT ?, student_id, 'Invited'
      FROM GROUP_MEMBER WHERE group_id = ?`,
      [meetingId, groupId],
    );
    for (const [index, item] of agenda.entries()) {
      await connection.execute(
        `INSERT INTO MEETING_AGENDA
          (meeting_id, agenda_title, agenda_description)
        VALUES (?, ?, ?)`,
        [meetingId, String(item).trim().slice(0, 150), `Agenda item ${index + 1}`],
      );
    }
    await connection.commit();
    return NextResponse.json({ meetingId }, { status: 201 });
  } catch (error) {
    if (connection) await connection.rollback();
    return errorResponse(error);
  } finally {
    connection?.release();
  }
}
