import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [rows] = await getPool().query(
      `SELECT
        group_id AS groupId,
        group_name AS groupName,
        group_description AS groupDescription,
        project_estimated_hrs AS estimatedProjectHours,
        member_count AS memberCount,
        task_count AS taskCount,
        completed_task_count AS completedTaskCount
      FROM v_group_overview
      ORDER BY group_name`,
    );

    const groups = (rows as Array<{ estimatedProjectHours: number | string }>).map(
      (group) => ({
        ...group,
        estimatedProjectHours: Number(group.estimatedProjectHours),
      }),
    );

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Failed to load groups:", error);
    return NextResponse.json(
      { error: "Unable to load groups. Check the database configuration." },
      { status: 500 },
    );
  }
}
