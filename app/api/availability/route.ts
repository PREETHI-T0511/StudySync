import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireGroupMembership, requireUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
import {
  errorResponse,
  positiveInteger,
  readJsonObject,
  validDate,
  validTime,
} from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const groupIdParam = url.searchParams.get("groupId");
    let rows: RowDataPacket[];
    if (groupIdParam) {
      const groupId = positiveInteger(groupIdParam, "groupId");
      await requireGroupMembership(groupId, user);
      [rows] = await getPool().execute<RowDataPacket[]>(
        `SELECT a.availability_id AS availabilityId, a.student_id AS studentId,
          s.student_name AS studentName, a.available_date AS availableDate,
          a.start_time AS startTime, a.end_time AS endTime
        FROM AVAILABILITY AS a
        JOIN GROUP_MEMBER AS gm ON gm.student_id = a.student_id
        JOIN STUDENT AS s ON s.student_id = a.student_id
        WHERE gm.group_id = ?
        ORDER BY a.available_date, a.start_time, s.student_name`,
        [groupId],
      );
    } else {
      [rows] = await getPool().execute<RowDataPacket[]>(
        `SELECT availability_id AS availabilityId, student_id AS studentId,
          available_date AS availableDate, start_time AS startTime, end_time AS endTime
        FROM AVAILABILITY
        WHERE student_id = ?
        ORDER BY available_date, start_time`,
        [user.studentId],
      );
    }

    return NextResponse.json({ availability: rows });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await readJsonObject(request);
    const availableDate = validDate(body.availableDate, "availableDate")!;
    const startTime = validTime(body.startTime, "startTime");
    const endTime = validTime(body.endTime, "endTime");
    if (endTime <= startTime) {
      return NextResponse.json(
        { error: "endTime must be later than startTime." },
        { status: 400 },
      );
    }
    const [result] = await getPool().execute(
      `INSERT INTO AVAILABILITY (student_id, available_date, start_time, end_time)
      VALUES (?, ?, ?, ?)`,
      [user.studentId, availableDate, startTime, endTime],
    );
    return NextResponse.json(
      { availabilityId: (result as { insertId: number }).insertId },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
