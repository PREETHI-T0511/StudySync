import { DefaultEmbeddingFunction } from "@chroma-core/default-embed";
import { ChromaClient } from "chromadb";

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
