import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { syncTaskDocuments } from "@/lib/chroma";
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

const MAX_RESULTS = 10;
const MAX_COSINE_DISTANCE = 0.65;

function getTextMatchRank(task: SearchTaskRow, query: string): number | null {
  const normalizedQuery = query.toLocaleLowerCase();
  const title = task.title.toLocaleLowerCase();
  const description = task.description?.toLocaleLowerCase() ?? "";

  if (title === normalizedQuery) return 0;
  if (title.startsWith(normalizedQuery)) return 1;
  if (title.includes(normalizedQuery)) return 2;
  if (description.includes(normalizedQuery)) return 3;
  return null;
}

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

    const textMatches = tasks
      .map((task) => ({ task, rank: getTextMatchRank(task, query) }))
      .filter(
        (match): match is { task: SearchTaskRow; rank: number } =>
          match.rank !== null,
      )
      .sort(
        (first, second) =>
          first.rank - second.rank ||
          first.task.title.localeCompare(second.task.title),
      )
      .map(({ task }) => Number(task.id));

    try {
      const collection = await syncTaskDocuments(tasks);
      const ids = tasks.map((task) => String(task.id));

      const groupIds = [...new Set(tasks.map((task) => Number(task.groupId)))];
      const results = await collection.query({
        queryTexts: [query],
        nResults: tasks.length,
        where: { groupId: { $in: groupIds } },
      });
      const visibleTaskIds = new Set(ids);
      const resultIds = results.ids[0] ?? [];
      const distances = results.distances?.[0] ?? [];
      const taskIds = resultIds.flatMap((id, index) => {
        const distance = distances[index];
        if (
          !visibleTaskIds.has(id) ||
          distance === null ||
          distance === undefined ||
          distance > MAX_COSINE_DISTANCE
        ) {
          return [];
        }
        return [Number(id)];
      });
      const rankedTaskIds = [
        ...textMatches,
        ...taskIds.filter((taskId) => !textMatches.includes(taskId)),
      ].slice(0, MAX_RESULTS);
      return NextResponse.json({ taskIds: rankedTaskIds });
    } catch (error) {
      console.error("ChromaDB task search failed:", error);
      return NextResponse.json({
        taskIds: textMatches.slice(0, MAX_RESULTS),
        warning: "Semantic search is unavailable; showing text matches only.",
      });
    }
  } catch (error) {
    return errorResponse(error);
  }
}
