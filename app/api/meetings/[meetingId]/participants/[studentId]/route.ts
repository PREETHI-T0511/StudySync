import { NextResponse } from "next/server";
import { requireGroupLeader, requireGroupMembership, requireUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
import {
  errorResponse,
  HttpError,
  positiveInteger,
  readJsonObject,
} from "@/lib/http";
import type { RowDataPacket } from "mysql2";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ meetingId: string; studentId: string }>;
};

async function groupForMeeting(meetingId: number) {
  const [rows] = await getPool().execute<
    (RowDataPacket & { group_id: number })[]
  >("SELECT group_id FROM MEETING WHERE meeting_id = ?", [meetingId]);
  if (!rows[0]) throw new HttpError(404, "Meeting not found.");
  return rows[0].group_id;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { meetingId: rawMeetingId, studentId: rawStudentId } = await context.params;
    const meetingId = positiveInteger(rawMeetingId, "meetingId");
    const studentId = positiveInteger(rawStudentId, "studentId");
    const groupId = await groupForMeeting(meetingId);
    const { isLeader } = await requireGroupMembership(groupId, user);
    if (!isLeader && studentId !== user.studentId) {
      throw new HttpError(403, "You may only update your own attendance.");
    }

    const body = await readJsonObject(request);
    const attendanceStatusValue = body.attendanceStatus;
    if (
      typeof attendanceStatusValue !== "string" ||
      !["Invited", "Accepted", "Declined", "Attended", "Absent"].includes(attendanceStatusValue)
    ) {
      throw new HttpError(400, "attendanceStatus is not valid.");
    }
    const attendanceStatus = attendanceStatusValue;
    const [result] = await getPool().execute(
      `UPDATE MEETING_PARTICIPANT
      SET attendance_status = ?
      WHERE meeting_id = ? AND student_id = ?`,
      [attendanceStatus, meetingId, studentId],
    );
    if ((result as { affectedRows: number }).affectedRows === 0) {
      throw new HttpError(404, "Meeting participant not found.");
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { meetingId: rawMeetingId, studentId: rawStudentId } = await context.params;
    const meetingId = positiveInteger(rawMeetingId, "meetingId");
    const studentId = positiveInteger(rawStudentId, "studentId");
    const groupId = await groupForMeeting(meetingId);
    await requireGroupLeader(groupId, user);
    const [result] = await getPool().execute(
      "DELETE FROM MEETING_PARTICIPANT WHERE meeting_id = ? AND student_id = ?",
      [meetingId, studentId],
    );
    if ((result as { affectedRows: number }).affectedRows === 0) {
      throw new HttpError(404, "Meeting participant not found.");
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
