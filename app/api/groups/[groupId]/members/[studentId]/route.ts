import { NextResponse } from "next/server";
import { requireGroupLeader, requireUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { errorResponse, HttpError, positiveInteger } from "@/lib/http";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ groupId: string; studentId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  let connection: Awaited<ReturnType<ReturnType<typeof getPool>["getConnection"]>> | undefined;
  try {
    const user = await requireUser();
    const { groupId: rawGroupId, studentId: rawStudentId } = await context.params;
    const groupId = positiveInteger(rawGroupId, "groupId");
    const studentId = positiveInteger(rawStudentId, "studentId");
    await requireGroupLeader(groupId, user);
    if (studentId === user.studentId) {
      throw new HttpError(400, "A group leader cannot remove themselves from the group.");
    }

    connection = await getPool().getConnection();
    await connection.beginTransaction();
    await connection.execute(
      `DELETE FROM TASK_ASSIGNMENT
      WHERE student_id = ?
        AND task_id IN (SELECT task_id FROM TASK WHERE group_id = ?)`,
      [studentId, groupId],
    );
    await connection.execute(
      `DELETE FROM MEETING_PARTICIPANT
      WHERE student_id = ?
        AND meeting_id IN (SELECT meeting_id FROM MEETING WHERE group_id = ?)`,
      [studentId, groupId],
    );
    const [result] = await connection.execute(
      "DELETE FROM GROUP_MEMBER WHERE group_id = ? AND student_id = ?",
      [groupId, studentId],
    );
    if ((result as { affectedRows: number }).affectedRows === 0) {
      throw new HttpError(404, "Group member not found.");
    }
    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (connection) await connection.rollback();
    return errorResponse(error);
  } finally {
    connection?.release();
  }
}
