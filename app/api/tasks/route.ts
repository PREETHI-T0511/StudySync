import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { errorResponse, positiveInteger } from "@/lib/http";

export const runtime = "nodejs";

type TaskRow = RowDataPacket & {
  id: number;
  groupId: number;
  groupName: string;
  title: string;
  description: string | null;
  due: string | Date | null;
  estimatedHours: number | string;
  priority: string;
  status: string;
  assignmentStatus: string | null;
  assignedHours: number | string | null;
  studentId: number | null;
  assignee: string | null;
};

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const groupIdParam = url.searchParams.get("groupId");
    const values: number[] = [user.studentId];
    let groupPredicate = "";
    if (groupIdParam) {
      const groupId = positiveInteger(groupIdParam, "groupId");
      values.push(groupId);
      groupPredicate = " AND t.group_id = ?";
    }

    const [rows] = await getPool().execute<TaskRow[]>(
      `SELECT
        t.task_id AS id,
        t.group_id AS groupId,
        g.group_name AS groupName,
        t.task_title AS title,
        t.task_description AS description,
        t.deadline AS due,
        t.estimated_hrs AS estimatedHours,
        t.priority,
        t.status,
        ta.assignment_status AS assignmentStatus,
        ta.assigned_hours AS assignedHours,
        assignee.student_id AS studentId,
        assignee.student_name AS assignee
      FROM TASK AS t
      JOIN \`GROUP\` AS g ON g.group_id = t.group_id
      JOIN GROUP_MEMBER AS viewer ON viewer.group_id = g.group_id AND viewer.student_id = ?
      LEFT JOIN TASK_ASSIGNMENT AS ta
        ON ta.task_id = t.task_id AND ta.student_id = ?
      LEFT JOIN STUDENT AS assignee ON assignee.student_id = ta.student_id
      WHERE 1 = 1${groupPredicate}
      ORDER BY t.deadline IS NULL, t.deadline, t.task_id`,
      [user.studentId, user.studentId, ...(groupIdParam ? [positiveInteger(groupIdParam, "groupId")] : [])],
    );

    return NextResponse.json({ tasks: rows.map((row) => ({
      ...row,
      due: row.due instanceof Date ? row.due.toISOString().slice(0, 10) : row.due,
      estimatedHours: Number(row.estimatedHours),
      assignedHours: row.assignedHours === null ? null : Number(row.assignedHours),
    })) });
  } catch (error) {
    return errorResponse(error);
  }
}
