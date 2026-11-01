import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireGroupLeader, requireUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
import {
  errorResponse,
  HttpError,
  optionalString,
  positiveInteger,
  readJsonObject,
  requiredString,
} from "@/lib/http";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ meetingId: string; agendaId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { meetingId: rawMeetingId, agendaId: rawAgendaId } = await context.params;
    const meetingId = positiveInteger(rawMeetingId, "meetingId");
    const agendaId = positiveInteger(rawAgendaId, "agendaId");
    const [rows] = await getPool().execute<
      (RowDataPacket & { group_id: number })[]
    >(
      `SELECT m.group_id FROM MEETING_AGENDA AS a
      JOIN MEETING AS m ON m.meeting_id = a.meeting_id
      WHERE a.agenda_id = ? AND a.meeting_id = ?`,
      [agendaId, meetingId],
    );
    if (!rows[0]) throw new HttpError(404, "Agenda item not found.");
    await requireGroupLeader(rows[0].group_id, user);
    const body = await readJsonObject(request);
    const title = requiredString(body, "agendaTitle", 150)!;
    const description = optionalString(body, "agendaDescription", 65535);
    await getPool().execute(
      `UPDATE MEETING_AGENDA
      SET agenda_title = ?, agenda_description = ?
      WHERE agenda_id = ? AND meeting_id = ?`,
      [title, description, agendaId, meetingId],
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { meetingId: rawMeetingId, agendaId: rawAgendaId } = await context.params;
    const meetingId = positiveInteger(rawMeetingId, "meetingId");
    const agendaId = positiveInteger(rawAgendaId, "agendaId");
    const [rows] = await getPool().execute<
      (RowDataPacket & { group_id: number })[]
    >(
      `SELECT m.group_id FROM MEETING_AGENDA AS a
      JOIN MEETING AS m ON m.meeting_id = a.meeting_id
      WHERE a.agenda_id = ? AND a.meeting_id = ?`,
      [agendaId, meetingId],
    );
    if (!rows[0]) throw new HttpError(404, "Agenda item not found.");
    await requireGroupLeader(rows[0].group_id, user);
    await getPool().execute(
      "DELETE FROM MEETING_AGENDA WHERE agenda_id = ? AND meeting_id = ?",
      [agendaId, meetingId],
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
