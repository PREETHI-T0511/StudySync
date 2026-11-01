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

type RouteContext = { params: Promise<{ taskId: string; studentId: string }> };

async function getTaskGroup(taskId: number) {
  const [rows] = await getPool().execute<
    (RowDataPacket & { group_id: number })[]
  >("SELECT group_id FROM TASK WHERE task_id = ?", [taskId]);
  if (!rows[0]) throw new HttpError(404, "Task not found.");
  return rows[0].group_id;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { taskId: rawTaskId, studentId: rawStudentId } = await context.params;
    const taskId = positiveInteger(rawTaskId, "taskId");
    const previousStudentId = positiveInteger(rawStudentId, "studentId");
    const groupId = await getTaskGroup(taskId);
    await requireGroupLeader(groupId, user);
    const body = await readJsonObject(request);
    const newStudentId =
      body.studentId === undefined
        ? previousStudentId
        : positiveInteger(String(body.studentId), "studentId");
    const assignedHours = positiveNumber(body.assignedHours, "assignedHours");
    const assignmentStatusValue = body.assignmentStatus ?? "Assigned";
    if (
      typeof assignmentStatusValue !== "string" ||
      !["Assigned", "In Progress", "Completed"].includes(assignmentStatusValue)
    ) {
      throw new HttpError(400, "assignmentStatus is not valid.");
    }
    const assignmentStatus = assignmentStatusValue;

    const [membership] = await getPool().execute<RowDataPacket[]>(
      "SELECT 1 FROM GROUP_MEMBER WHERE group_id = ? AND student_id = ?",
      [groupId, newStudentId],
    );
    if (!membership[0]) throw new HttpError(400, "The assignee must belong to this group.");

    const [result] = await getPool().execute(
      `UPDATE TASK_ASSIGNMENT
      SET student_id = ?, assigned_hours = ?, assignment_status = ?
      WHERE task_id = ? AND student_id = ?`,
      [newStudentId, assignedHours, assignmentStatus, taskId, previousStudentId],
    );
    if ((result as { affectedRows: number }).affectedRows === 0) {
      throw new HttpError(404, "Task assignment not found.");
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { taskId: rawTaskId, studentId: rawStudentId } = await context.params;
    const taskId = positiveInteger(rawTaskId, "taskId");
    const studentId = positiveInteger(rawStudentId, "studentId");
    await requireGroupLeader(await getTaskGroup(taskId), user);
    const [result] = await getPool().execute(
      "DELETE FROM TASK_ASSIGNMENT WHERE task_id = ? AND student_id = ?",
      [taskId, studentId],
    );
    if ((result as { affectedRows: number }).affectedRows === 0) {
      throw new HttpError(404, "Task assignment not found.");
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
