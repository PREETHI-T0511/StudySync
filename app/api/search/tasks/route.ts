import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getTaskCollection } from "@/lib/chroma";
import { requireUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { errorResponse, HttpError } from "@/lib/http";

export const runtime = "nodejs";

type SearchTaskRow = RowDataPacket & {
  id: number;
  groupId: number;
  groupName: string;
  title: string;
  description: string | null;
  assignees: string | null;
};

const MAX_RESULTS = 20;

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (query.length < 2) {
      return NextResponse.json({ taskIds: [] });
    }
    if (query.length > 200) {
      throw new HttpError(400, "Search queries must be 200 characters or fewer.");
    }

    const [tasks] = await getPool().execute<SearchTaskRow[]>(
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
      return NextResponse.json({ taskIds: [] });
    }

    try {
      const collection = await getTaskCollection();
      const ids = tasks.map((task) => String(task.id));
      const indexed = await collection.get({ ids, include: ["documents"] });
      const indexedDocuments = new Map(
        indexed.ids.map((id, index) => [id, indexed.documents[index]]),
      );
      const changedTasks = tasks.filter((task) => {
        const document = [
          `Task: ${task.title}`,
          `Description: ${task.description ?? ""}`,
          `Team: ${task.groupName}`,
          `Assignees: ${task.assignees ?? "Unassigned"}`,
        ].join("\n");
        return indexedDocuments.get(String(task.id)) !== document;
      });

      if (changedTasks.length > 0) {
        await collection.upsert({
          ids: changedTasks.map((task) => String(task.id)),
          documents: changedTasks.map((task) => [
            `Task: ${task.title}`,
            `Description: ${task.description ?? ""}`,
            `Team: ${task.groupName}`,
            `Assignees: ${task.assignees ?? "Unassigned"}`,
          ].join("\n")),
          metadatas: changedTasks.map((task) => ({ groupId: Number(task.groupId) })),
        });
      }

      const groupIds = [...new Set(tasks.map((task) => Number(task.groupId)))];
      const results = await collection.query({
        queryTexts: [query],
        nResults: Math.min(MAX_RESULTS, tasks.length),
        where: { groupId: { $in: groupIds } },
      });
      const visibleTaskIds = new Set(ids);
      const taskIds = (results.ids[0] ?? [])
        .filter((id) => visibleTaskIds.has(id))
        .map(Number);
      return NextResponse.json({ taskIds });
    } catch (error) {
      console.error("ChromaDB task search failed:", error);
      throw new HttpError(
        503,
        "Semantic search is unavailable. Start local ChromaDB with `docker compose up -d chroma` and try again.",
      );
    }
  } catch (error) {
    return errorResponse(error);
  }
}
