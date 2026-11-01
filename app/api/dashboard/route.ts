import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export const runtime = "nodejs";

type StatsRow = RowDataPacket & {
  totalGroups: number;
  ledGroups: number;
  memberGroups: number;
  totalAssignedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  upcomingMeetings: number;
};

export async function GET() {
  try {
    const user = await requireUser();
    const [stats] = await getPool().execute<StatsRow[]>(
      `SELECT
        COUNT(DISTINCT g.group_id) AS totalGroups,
        COUNT(DISTINCT CASE WHEN g.created_by = ? THEN g.group_id END) AS ledGroups,
        COUNT(DISTINCT CASE WHEN g.created_by IS NULL OR g.created_by <> ? THEN g.group_id END) AS memberGroups,
        COUNT(DISTINCT ta.task_id) AS totalAssignedTasks,
        COUNT(DISTINCT CASE WHEN t.status = 'Pending' THEN t.task_id END) AS pendingTasks,
        COUNT(DISTINCT CASE WHEN t.status = 'In Progress' THEN t.task_id END) AS inProgressTasks,
        COUNT(DISTINCT CASE WHEN t.status = 'Completed' THEN t.task_id END) AS completedTasks,
        (
          SELECT COUNT(*)
          FROM MEETING AS m
          JOIN \`GROUP\` AS meeting_group ON meeting_group.group_id = m.group_id
          LEFT JOIN GROUP_MEMBER AS meeting_member
            ON meeting_member.group_id = m.group_id AND meeting_member.student_id = ?
          WHERE (meeting_member.student_id IS NOT NULL OR meeting_group.created_by = ?)
            AND m.meeting_date >= CURRENT_DATE
        ) AS upcomingMeetings
      FROM \`GROUP\` AS g
      LEFT JOIN GROUP_MEMBER AS gm ON gm.group_id = g.group_id AND gm.student_id = ?
      LEFT JOIN TASK AS t ON t.group_id = g.group_id
      LEFT JOIN TASK_ASSIGNMENT AS ta
        ON ta.task_id = t.task_id AND ta.student_id = ?
      WHERE g.created_by = ? OR gm.student_id IS NOT NULL`,
      [
        user.studentId,
        user.studentId,
        user.studentId,
        user.studentId,
        user.studentId,
        user.studentId,
        user.studentId,
      ],
    );
    const [meetings] = await getPool().execute<
      (RowDataPacket & {
        meetingId: number;
        title: string;
        groupName: string;
        meetingDate: string | Date;
        startTime: string;
      })[]
    >(
      `SELECT m.meeting_id AS meetingId, m.meeting_title AS title,
        g.group_name AS groupName, m.meeting_date AS meetingDate,
        m.start_time AS startTime
      FROM MEETING AS m
      JOIN \`GROUP\` AS g ON g.group_id = m.group_id
      LEFT JOIN GROUP_MEMBER AS gm ON gm.group_id = g.group_id AND gm.student_id = ?
      WHERE (gm.student_id IS NOT NULL OR g.created_by = ?)
        AND m.meeting_date >= CURRENT_DATE
      GROUP BY m.meeting_id
      ORDER BY m.meeting_date, m.start_time
      LIMIT 5`,
      [user.studentId, user.studentId],
    );

    return NextResponse.json({ stats: stats[0], upcomingMeetings: meetings });
  } catch (error) {
    return errorResponse(error);
  }
}
