import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireGroupLeader, requireUser } from "@/lib/auth";
import { syncTaskDocuments } from "@/lib/chroma";
import { getPool } from "@/lib/db";
import {
  errorResponse,
  HttpError,
  optionalString,
  positiveInteger,
  readJsonObject,
  requiredString,
} from "@/lib/http";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ groupId: string }> };
type TaskRow = RowDataPacket & {
  id: number;
  groupId: number;
  groupName: string;
  title: string;
  description: string | null;
  assignees: string | null;
};

const MAX_RESULTS = 5;
const MAX_COSINE_DISTANCE = 0.45;

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const groupId = positiveInteger((await context.params).groupId, "groupId");
    await requireGroupLeader(groupId, user);
    const body = await readJsonObject(request);
    const title = requiredString(body, "taskTitle", 150)!;
    const description = optionalString(body, "taskDescription", 65535);

    const [tasks] = await getPool().execute<TaskRow[]>(
      `SELECT
        t.task_id AS id,
        t.group_id AS groupId,
        g.group_name AS groupName,
        t.task_title AS title,
        t.task_description AS description,
        GROUP_CONCAT(DISTINCT s.student_name ORDER BY s.student_name SEPARATOR ', ') AS assignees
      FROM TASK AS t
      JOIN \`GROUP\` AS g ON g.group_id = t.group_id
      JOIN GROUP_MEMBER AS viewer
        ON viewer.group_id = g.group_id AND viewer.student_id = ?
      LEFT JOIN TASK_ASSIGNMENT AS ta ON ta.task_id = t.task_id
      LEFT JOIN STUDENT AS s ON s.student_id = ta.student_id
      GROUP BY t.task_id, t.group_id, g.group_name, t.task_title, t.task_description`,
      [user.studentId],
    );

    if (tasks.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    try {
      const collection = await syncTaskDocuments(tasks);
      const groupIds = [...new Set(tasks.map((task) => Number(task.groupId)))];
      const results = await collection.query({
        queryTexts: [`Task: ${title}\nDescription: ${description ?? ""}`],
        nResults: Math.min(MAX_RESULTS, tasks.length),
        where: { groupId: { $in: groupIds } },
      });
      const tasksById = new Map(tasks.map((task) => [String(task.id), task]));
      const ids = results.ids[0] ?? [];
      const distances = results.distances?.[0] ?? [];
      const matches = ids.flatMap((id, index) => {
        const task = tasksById.get(id);
        const distance = distances[index];
        if (!task || distance === null || distance === undefined || distance > MAX_COSINE_DISTANCE) {
          return [];
        }
        return [{
          id: task.id,
          groupId: task.groupId,
          groupName: task.groupName,
          title: task.title,
          description: task.description,
          similarity: Math.max(0, 1 - distance),
        }];
      });

      return NextResponse.json({ matches });
    } catch (error) {
      console.error("ChromaDB duplicate task detection failed:", error);
      throw new HttpError(
        503,
        "Semantic duplicate detection is unavailable. Start local ChromaDB with `docker compose up -d chroma` and try again.",
      );
    }
  } catch (error) {
    return errorResponse(error);
  }
}
