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

type RouteContext = { params: Promise<{ groupId: string }> };
type TaskRow = RowDataPacket & {
  task_id: number;
  task_title: string;
  task_description: string | null;
  deadline: string | Date | null;
  priority: string;
  status: string;
  estimated_hrs: number | string;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const groupId = positiveInteger((await context.params).groupId, "groupId");
    await requireGroupMembership(groupId, user);
    const [procedureResults] = await getPool().query("CALL GetGroupTasks(?)", [groupId]);
    const resultSets = procedureResults as TaskRow[][];
    const rows = resultSets[0] ?? [];
    const taskIds = rows.map((task) => task.task_id);
    const assignmentsByTask = new Map<number, RowDataPacket[]>();

    if (taskIds.length > 0) {
      const [assignments] = await getPool().query<RowDataPacket[]>(
        `SELECT ta.task_id AS taskId, ta.student_id AS studentId,
          s.student_name AS studentName, ta.assigned_hours AS assignedHours,
          ta.assignment_status AS assignmentStatus
        FROM TASK_ASSIGNMENT AS ta
        JOIN STUDENT AS s ON s.student_id = ta.student_id
        WHERE ta.task_id IN (${taskIds.map(() => "?").join(",")})
        ORDER BY s.student_name`,
        taskIds,
      );
      for (const assignment of assignments) {
        const key = Number(assignment.taskId);
        assignmentsByTask.set(key, [...(assignmentsByTask.get(key) ?? []), assignment]);
      }
    }

    return NextResponse.json({
      tasks: rows.map((task) => ({
        ...task,
        estimated_hrs: Number(task.estimated_hrs),
        deadline:
          task.deadline instanceof Date
            ? task.deadline.toISOString().slice(0, 10)
            : task.deadline,
        assignments: assignmentsByTask.get(task.task_id) ?? [],
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  let connection: Awaited<ReturnType<ReturnType<typeof getPool>["getConnection"]>> | undefined;
  try {
    connection = await getPool().getConnection();
    const user = await requireUser();
    const groupId = positiveInteger((await context.params).groupId, "groupId");
    await requireGroupLeader(groupId, user);
    const body = await readJsonObject(request);
    const title = requiredString(body, "taskTitle", 150)!;
    const description = optionalString(body, "taskDescription", 65535);
    const deadline = validDate(body.deadline, "deadline", true);
    const priorityValue = body.priority ?? "Medium";
    const statusValue = body.status ?? "Pending";
    const estimatedHours = positiveNumber(body.estimatedHrs, "estimatedHrs");
    if (!["Low", "Medium", "High"].includes(String(priorityValue))) {
      throw new HttpError(400, "priority must be Low, Medium, or High.");
    }
    if (!["Pending", "In Progress", "Completed"].includes(String(statusValue))) {
      throw new HttpError(400, "status must be Pending, In Progress, or Completed.");
    }
    const priority = String(priorityValue);
    const status = String(statusValue);

    const assigneeId =
      body.studentId === undefined || body.studentId === null || body.studentId === ""
        ? null
        : Number(body.studentId);
    const assignedHours =
      body.assignedHours === undefined || body.assignedHours === null || body.assignedHours === ""
        ? null
        : positiveNumber(body.assignedHours, "assignedHours");
    if ((assigneeId === null) !== (assignedHours === null)) {
      throw new HttpError(400, "studentId and assignedHours must be supplied together.");
    }
    if (assigneeId !== null && !Number.isSafeInteger(assigneeId)) {
      throw new HttpError(400, "studentId must be a positive integer.");
    }

    await connection.beginTransaction();
    if (assigneeId !== null) {
      const [membership] = await connection.execute<RowDataPacket[]>(
        "SELECT 1 FROM GROUP_MEMBER WHERE group_id = ? AND student_id = ?",
        [groupId, assigneeId],
      );
      if (!membership[0]) throw new HttpError(400, "The assignee must belong to this group.");
    }
    const [result] = await connection.execute(
      `INSERT INTO TASK
        (group_id, task_title, task_description, deadline, priority, status, estimated_hrs)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [groupId, title, description, deadline, priority, status, estimatedHours],
    );
    const taskId = (result as { insertId: number }).insertId;
    if (assigneeId !== null && assignedHours !== null) {
      await connection.execute(
        `INSERT INTO TASK_ASSIGNMENT
          (task_id, student_id, assigned_date, assigned_hours, assignment_status)
        VALUES (?, ?, CURRENT_DATE, ?, 'Assigned')`,
        [taskId, assigneeId, assignedHours],
      );
    }
    await connection.commit();
    return NextResponse.json({ taskId }, { status: 201 });
  } catch (error) {
    if (connection) await connection.rollback();
    return errorResponse(error);
  } finally {
    connection?.release();
  }
}
