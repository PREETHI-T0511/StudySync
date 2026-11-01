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
    await requireGroupMembership(await groupForMeeting(meetingId), user);
    const [agenda] = await getPool().execute<RowDataPacket[]>(
      `SELECT agenda_id AS agendaId, agenda_title AS agendaTitle,
        agenda_description AS agendaDescription
      FROM MEETING_AGENDA WHERE meeting_id = ? ORDER BY agenda_id`,
      [meetingId],
    );
    return NextResponse.json({ agenda });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const meetingId = positiveInteger((await context.params).meetingId, "meetingId");
    await requireGroupLeader(await groupForMeeting(meetingId), user);
    const body = await readJsonObject(request);
    const title = requiredString(body, "agendaTitle", 150)!;
    const description =
      typeof body.agendaDescription === "string"
        ? body.agendaDescription.trim() || null
        : null;
    const [result] = await getPool().execute(
      `INSERT INTO MEETING_AGENDA
        (meeting_id, agenda_title, agenda_description)
      VALUES (?, ?, ?)`,
      [meetingId, title, description],
    );
    return NextResponse.json(
      { agendaId: (result as { insertId: number }).insertId },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
