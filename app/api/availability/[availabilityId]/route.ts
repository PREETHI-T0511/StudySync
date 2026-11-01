import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
import {
  errorResponse,
  HttpError,
  positiveInteger,
  readJsonObject,
  validDate,
  validTime,
} from "@/lib/http";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ availabilityId: string }> };

async function ownedAvailability(availabilityId: number, studentId: number) {
  const [rows] = await getPool().execute<
    (RowDataPacket & { availability_id: number })[]
  >(
    "SELECT availability_id FROM AVAILABILITY WHERE availability_id = ? AND student_id = ?",
    [availabilityId, studentId],
  );
  if (!rows[0]) throw new HttpError(404, "Availability record not found.");
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const availabilityId = positiveInteger(
      (await context.params).availabilityId,
      "availabilityId",
    );
    await ownedAvailability(availabilityId, user.studentId);
    const body = await readJsonObject(request);
    const availableDate = validDate(body.availableDate, "availableDate")!;
    const startTime = validTime(body.startTime, "startTime");
    const endTime = validTime(body.endTime, "endTime");
    if (endTime <= startTime) throw new HttpError(400, "endTime must be later than startTime.");

    await getPool().execute(
      `UPDATE AVAILABILITY
      SET available_date = ?, start_time = ?, end_time = ?
      WHERE availability_id = ? AND student_id = ?`,
      [availableDate, startTime, endTime, availabilityId, user.studentId],
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const availabilityId = positiveInteger(
      (await context.params).availabilityId,
      "availabilityId",
    );
    await ownedAvailability(availabilityId, user.studentId);
    await getPool().execute(
      "DELETE FROM AVAILABILITY WHERE availability_id = ? AND student_id = ?",
      [availabilityId, user.studentId],
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
