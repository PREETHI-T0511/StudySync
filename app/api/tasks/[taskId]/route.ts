import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireGroupLeader, requireGroupMembership, requireUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
import {
  errorResponse,
  HttpError,
  optionalString,
  positiveInteger,
  positiveNumber,
  readJsonObject,
  requiredString,
  validDate,
} from "@/lib/http";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ taskId: string }> };
type TaskGroupRow = RowDataPacket & { group_id: number };

async function taskGroup(taskId: number) {
  const [rows] = await getPool().execute<TaskGroupRow[]>(
    "SELECT group_id FROM TASK WHERE task_id = ?",
    [taskId],
  );
  if (!rows[0]) throw new HttpError(404, "Task not found.");
  return rows[0].group_id;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const taskId = positiveInteger((await context.params).taskId, "taskId");
    const groupId = await taskGroup(taskId);
    await requireGroupMembership(groupId, user);
    const [rows] = await getPool().execute<RowDataPacket[]>(
      `SELECT t.task_id AS taskId, t.group_id AS groupId, t.task_title AS taskTitle,
        t.task_description AS taskDescription, t.deadline, t.priority, t.status,
        t.estimated_hrs AS estimatedHrs, ta.student_id AS studentId,
        s.student_name AS studentName, ta.assigned_hours AS assignedHours,
        ta.assignment_status AS assignmentStatus
      FROM TASK AS t
      LEFT JOIN TASK_ASSIGNMENT AS ta ON ta.task_id = t.task_id
      LEFT JOIN STUDENT AS s ON s.student_id = ta.student_id
      WHERE t.task_id = ?`,
      [taskId],
    );
    return NextResponse.json({ task: rows });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const taskId = positiveInteger((await context.params).taskId, "taskId");
    const groupId = await taskGroup(taskId);
    const { isLeader } = await requireGroupMembership(groupId, user);
    const body = await readJsonObject(request);

    if (!isLeader) {
      if (body.status === undefined || Object.keys(body).some((key) => key !== "status")) {
        throw new HttpError(403, "Members may only update task progress for their own assignments.");
      }
      if (!["Pending", "In Progress", "Completed"].includes(String(body.status))) {
        throw new HttpError(400, "status must be Pending, In Progress, or Completed.");
      }
      const assignmentStatus =
        body.status === "Completed"
          ? "Completed"
          : body.status === "In Progress"
            ? "In Progress"
            : "Assigned";
      const [result] = await getPool().execute(
        `UPDATE TASK_ASSIGNMENT
        SET assignment_status = ?
        WHERE task_id = ? AND student_id = ?`,
        [assignmentStatus, taskId, user.studentId],
      );
      if ((result as { affectedRows: number }).affectedRows === 0) {
        throw new HttpError(403, "You are not assigned to this task.");
      }
      await getPool().execute(
        `UPDATE TASK
        SET status = CASE
          WHEN NOT EXISTS (
            SELECT 1 FROM TASK_ASSIGNMENT
            WHERE task_id = ? AND assignment_status <> 'Completed'
          ) THEN 'Completed'
          WHEN EXISTS (
            SELECT 1 FROM TASK_ASSIGNMENT
            WHERE task_id = ? AND assignment_status = 'In Progress'
          ) THEN 'In Progress'
          ELSE 'Pending'
        END
        WHERE task_id = ?`,
        [taskId, taskId, taskId],
      );
      return NextResponse.json({ success: true });
    }

    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    const allowedKeys = new Set([
      "taskTitle",
      "taskDescription",
      "deadline",
      "estimatedHrs",
      "priority",
      "status",
    ]);
    if (Object.keys(body).some((key) => !allowedKeys.has(key))) {
      throw new HttpError(400, "The request contains unsupported task fields.");
    }

    if ("taskTitle" in body) {
      fields.push("task_title = ?");
      values.push(requiredString(body, "taskTitle", 150)!);
    }
    if ("taskDescription" in body) {
      fields.push("task_description = ?");
      values.push(optionalString(body, "taskDescription", 65535));
    }
    if ("deadline" in body) {
      fields.push("deadline = ?");
      values.push(validDate(body.deadline, "deadline", true));
    }
    if ("estimatedHrs" in body) {
      fields.push("estimated_hrs = ?");
      values.push(positiveNumber(body.estimatedHrs, "estimatedHrs"));
    }
    if ("priority" in body) {
      if (!["Low", "Medium", "High"].includes(String(body.priority))) {
        throw new HttpError(400, "priority must be Low, Medium, or High.");
      }
      fields.push("priority = ?");
      values.push(String(body.priority));
    }
    if ("status" in body) {
      if (!["Pending", "In Progress", "Completed"].includes(String(body.status))) {
        throw new HttpError(400, "status must be Pending, In Progress, or Completed.");
      }
      fields.push("status = ?");
      values.push(String(body.status));
    }
    if (fields.length === 0) throw new HttpError(400, "Provide at least one task field to update.");

    await getPool().execute(
      `UPDATE TASK SET ${fields.join(", ")} WHERE task_id = ?`,
      [...values, taskId],
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const taskId = positiveInteger((await context.params).taskId, "taskId");
    const groupId = await taskGroup(taskId);
    await requireGroupLeader(groupId, user);
    await getPool().execute("DELETE FROM TASK_ASSIGNMENT WHERE task_id = ?", [taskId]);
    await getPool().execute("DELETE FROM TASK WHERE task_id = ?", [taskId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
