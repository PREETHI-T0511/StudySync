import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireGroupLeader, requireUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
import {
  errorResponse,
  HttpError,
  positiveInteger,
  positiveNumber,
  readJsonObject,
} from "@/lib/http";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ taskId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const taskId = positiveInteger((await context.params).taskId, "taskId");
    const [tasks] = await getPool().execute<(RowDataPacket & { group_id: number })[]>(
      "SELECT group_id FROM TASK WHERE task_id = ?",
      [taskId],
    );
    if (!tasks[0]) throw new HttpError(404, "Task not found.");
    await requireGroupLeader(tasks[0].group_id, user);
    const [assignments] = await getPool().execute<RowDataPacket[]>(
      `SELECT ta.assignment_id AS assignmentId, ta.student_id AS studentId,
        s.student_name AS studentName, ta.assigned_hours AS assignedHours,
        ta.assigned_date AS assignedDate, ta.assignment_status AS assignmentStatus
      FROM TASK_ASSIGNMENT AS ta
      JOIN STUDENT AS s ON s.student_id = ta.student_id
      WHERE ta.task_id = ?
      ORDER BY s.student_name`,
      [taskId],
    );
    return NextResponse.json({ assignments });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const taskId = positiveInteger((await context.params).taskId, "taskId");
    const [tasks] = await getPool().execute<
      (RowDataPacket & { group_id: number })[]
    >("SELECT group_id FROM TASK WHERE task_id = ?", [taskId]);
    if (!tasks[0]) throw new HttpError(404, "Task not found.");
    await requireGroupLeader(tasks[0].group_id, user);
    const body = await readJsonObject(request);
    const studentId = positiveInteger(String(body.studentId ?? ""), "studentId");
    const assignedHours = positiveNumber(body.assignedHours, "assignedHours");
    const [members] = await getPool().execute<RowDataPacket[]>(
      "SELECT 1 FROM GROUP_MEMBER WHERE group_id = ? AND student_id = ?",
      [tasks[0].group_id, studentId],
    );
    if (!members[0]) throw new HttpError(400, "The assignee must belong to the task group.");

    const [result] = await getPool().execute(
      `INSERT INTO TASK_ASSIGNMENT
        (task_id, student_id, assigned_date, assigned_hours, assignment_status)
      VALUES (?, ?, CURRENT_DATE, ?, 'Assigned')`,
      [taskId, studentId, assignedHours],
    );
    return NextResponse.json(
      { assignmentId: (result as { insertId: number }).insertId },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
