import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireGroupLeader, requireGroupMembership, requireUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
import {
  errorResponse,
  optionalString,
  positiveInteger,
  positiveNumber,
  readJsonObject,
  requiredString,
} from "@/lib/http";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ groupId: string }> };
type GroupDetailRow = RowDataPacket & {
  groupId: number;
  groupName: string;
  description: string | null;
  createdBy: number | null;
  leaderName: string | null;
  projectEstimatedHours: number | string;
  memberCount: number;
  taskCount: number;
  completedTaskCount: number;
};

async function groupIdFrom(context: RouteContext) {
  return positiveInteger((await context.params).groupId, "groupId");
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const groupId = await groupIdFrom(context);
    const { isLeader } = await requireGroupMembership(groupId, user);
    const [rows] = await getPool().execute<GroupDetailRow[]>(
      `SELECT
        g.group_id AS groupId,
        g.group_name AS groupName,
        g.description,
        g.created_by AS createdBy,
        leader.student_name AS leaderName,
        g.project_estimated_hrs AS projectEstimatedHours,
        overview.member_count AS memberCount,
        overview.task_count AS taskCount,
        overview.completed_task_count AS completedTaskCount
      FROM \`GROUP\` AS g
      JOIN v_group_overview AS overview ON overview.group_id = g.group_id
      LEFT JOIN STUDENT AS leader ON leader.student_id = g.created_by
      WHERE g.group_id = ?`,
      [groupId],
    );

    return NextResponse.json({
      group: {
        ...rows[0],
        projectEstimatedHours: Number(rows[0].projectEstimatedHours),
        isLeader,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const groupId = await groupIdFrom(context);
    await requireGroupLeader(groupId, user);
    const body = await readJsonObject(request);
    const groupName = requiredString(body, "groupName", 100)!;
    const description = optionalString(body, "description", 65535);
    const projectHours = positiveNumber(body.projectEstimatedHours, "projectEstimatedHours");

    await getPool().execute(
      `UPDATE \`GROUP\`
      SET group_name = ?, description = ?, project_estimated_hrs = ?
      WHERE group_id = ?`,
      [groupName, description, projectHours, groupId],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  let connection: Awaited<ReturnType<ReturnType<typeof getPool>["getConnection"]>> | undefined;
  try {
    const user = await requireUser();
    const groupId = await groupIdFrom(context);
    await requireGroupLeader(groupId, user);
    connection = await getPool().getConnection();
    await connection.beginTransaction();
    await connection.execute(
      `DELETE FROM TASK_ASSIGNMENT
      WHERE task_id IN (SELECT task_id FROM TASK WHERE group_id = ?)`,
      [groupId],
    );
    await connection.execute("DELETE FROM TASK WHERE group_id = ?", [groupId]);
    await connection.execute(
      `DELETE FROM MEETING_AGENDA
      WHERE meeting_id IN (SELECT meeting_id FROM MEETING WHERE group_id = ?)`,
      [groupId],
    );
    await connection.execute(
      `DELETE FROM MEETING_PARTICIPANT
      WHERE meeting_id IN (SELECT meeting_id FROM MEETING WHERE group_id = ?)`,
      [groupId],
    );
    await connection.execute("DELETE FROM MEETING WHERE group_id = ?", [groupId]);
    await connection.execute("DELETE FROM GROUP_MEMBER WHERE group_id = ?", [groupId]);
    await connection.execute("DELETE FROM `GROUP` WHERE group_id = ?", [groupId]);
    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (connection) await connection.rollback();
    return errorResponse(error);
  } finally {
    connection?.release();
  }
}
