import { DefaultEmbeddingFunction } from "@chroma-core/default-embed";
import { ChromaClient } from "chromadb";

export type TaskDocumentInput = {
  id: number;
  groupId: number;
  groupName: string;
  title: string;
  description: string | null;
  assignees: string | null;
};

let client: ChromaClient | undefined;
let embeddingFunction: DefaultEmbeddingFunction | undefined;

export function getChromaClient(): ChromaClient {
  if (!client) {
    const url = new URL(process.env.CHROMA_URL || "http://localhost:8000");
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("CHROMA_URL must use http or https.");
    }
    client = new ChromaClient({
      host: url.hostname,
      port: url.port
        ? Number(url.port)
        : url.protocol === "https:"
          ? 443
          : 8000,
      ssl: url.protocol === "https:",
    });
  }
  return client;
}

export async function getTaskCollection() {
  embeddingFunction ??= new DefaultEmbeddingFunction({ dtype: "q8" });
  return getChromaClient().getOrCreateCollection({
    name: "studysync_tasks",
    embeddingFunction,
    metadata: { "hnsw:space": "cosine" },
  });
}

export async function syncTaskDocuments(tasks: TaskDocumentInput[]) {
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
    ].join("\n");
    return indexedDocuments.get(String(task.id)) !== document;
  });

  if (changedTasks.length > 0) {
    await collection.upsert({
      ids: changedTasks.map((task) => String(task.id)),
      documents: changedTasks.map((task) => [
        `Task: ${task.title}`,
        `Description: ${task.description ?? ""}`,
      ].join("\n")),
      metadatas: changedTasks.map((task) => ({ groupId: Number(task.groupId) })),
    });
  }

  return collection;
}
