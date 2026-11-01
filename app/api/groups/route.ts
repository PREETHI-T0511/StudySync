import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
import {
  errorResponse,
  optionalString,
  positiveNumber,
  readJsonObject,
  requiredString,
} from "@/lib/http";

export const runtime = "nodejs";

type GroupRow = RowDataPacket & {
  groupId: number;
  groupName: string;
  groupDescription: string | null;
  estimatedProjectHours: number | string;
  plannedTaskHours: number | string;
  memberCount: number;
  taskCount: number;
  completedTaskCount: number;
  pendingTaskCount: number;
  inProgressTaskCount: number;
  assignedTaskCount: number;
  leaderName: string | null;
  isLeader: number;
  isCreator: number;
  role: string | null;
};

export async function GET() {
  try {
    const user = await requireUser();
    const [rows] = await getPool().execute<GroupRow[]>(
      `SELECT
        overview.group_id AS groupId,
        overview.group_name AS groupName,
        overview.group_description AS groupDescription,
        overview.project_estimated_hrs AS estimatedProjectHours,
        COALESCE(task_stats.planned_hours, 0) AS plannedTaskHours,
        overview.member_count AS memberCount,
        overview.task_count AS taskCount,
        overview.completed_task_count AS completedTaskCount,
        COALESCE(task_stats.pending_count, 0) AS pendingTaskCount,
        COALESCE(task_stats.in_progress_count, 0) AS inProgressTaskCount,
        COALESCE(assigned_stats.assigned_count, 0) AS assignedTaskCount,
        leader.student_name AS leaderName,
        (g.created_by = ?) AS isCreator,
        (g.created_by = ? OR current_member.role = 'Leader') AS isLeader,
        current_member.role AS role
      FROM v_group_overview AS overview
      JOIN \`GROUP\` AS g ON g.group_id = overview.group_id
      LEFT JOIN STUDENT AS leader ON leader.student_id = g.created_by
      LEFT JOIN GROUP_MEMBER AS current_member
        ON current_member.group_id = g.group_id AND current_member.student_id = ?
      LEFT JOIN (
        SELECT
          group_id,
          SUM(status = 'Pending') AS pending_count,
          SUM(status = 'In Progress') AS in_progress_count,
          SUM(estimated_hrs) AS planned_hours
        FROM TASK
        GROUP BY group_id
      ) AS task_stats ON task_stats.group_id = g.group_id
      LEFT JOIN (
        SELECT t.group_id, COUNT(DISTINCT ta.task_id) AS assigned_count
        FROM TASK_ASSIGNMENT AS ta
        JOIN TASK AS t ON t.task_id = ta.task_id
        WHERE ta.student_id = ?
        GROUP BY t.group_id
      ) AS assigned_stats ON assigned_stats.group_id = g.group_id
      WHERE g.created_by = ?
        OR EXISTS (
          SELECT 1 FROM GROUP_MEMBER AS gm
          WHERE gm.group_id = g.group_id AND gm.student_id = ?
        )
      ORDER BY g.group_name`,
      [
        user.studentId,
        user.studentId,
        user.studentId,
        user.studentId,
        user.studentId,
        user.studentId,
      ],
    );

    return NextResponse.json({
      groups: rows.map((row) => ({
        ...row,
        estimatedProjectHours: Number(row.estimatedProjectHours),
        plannedTaskHours: Number(row.plannedTaskHours),
        isLeader: Boolean(row.isLeader),
        isCreator: Boolean(row.isCreator),
        isMemberOnly: !Boolean(row.isCreator),
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  let connection: Awaited<ReturnType<ReturnType<typeof getPool>["getConnection"]>> | undefined;
  try {
    connection = await getPool().getConnection();
    const user = await requireUser();
    const body = await readJsonObject(request);
    const groupName = requiredString(body, "groupName", 100)!;
    const description = optionalString(body, "description", 65535);
    const projectHours = positiveNumber(body.projectEstimatedHours, "projectEstimatedHours");

    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO \`GROUP\`
        (group_name, description, created_date, created_by, project_estimated_hrs)
      VALUES (?, ?, CURRENT_DATE, ?, ?)`,
      [groupName, description, user.studentId, projectHours],
    );
    const groupId = (result as { insertId: number }).insertId;
    await connection.execute(
      `INSERT INTO GROUP_MEMBER (group_id, student_id, role, joined_date)
      VALUES (?, ?, 'Leader', CURRENT_DATE)`,
      [groupId, user.studentId],
    );
    await connection.commit();

    return NextResponse.json({ groupId }, { status: 201 });
  } catch (error) {
    if (connection) await connection.rollback();
    return errorResponse(error);
  } finally {
    connection?.release();
  }
}
