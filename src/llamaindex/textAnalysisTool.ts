import { Document, Settings, VectorStoreIndex } from "llamaindex";
import fs from "fs/promises";
import { openai, openaiEmbedding } from "@/openai";

Settings.llm = openai;
Settings.embedModel = openaiEmbedding;

async function textAnalysisTool(query: string) {
  const path = "node_modules/llamaindex/examples/abramov.txt";
  const essay = await fs.readFile(path, { encoding: "utf-8" });

  // Create Document object with essay
  const document = new Document({ text: essay, id_: path });

  // Split text and create embeddings. Store them in a VectorStoreIndex
  const index = await VectorStoreIndex.fromDocuments([document]);

  // Query the index
  const queryEngine = index.asQueryEngine();

  const stream = await queryEngine.query({
    query,
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.delta);
  }
}

export const run = () => {
  process.stdin.on("data", async (data) => {
    const query = data.toString().trim();
    if (query) {
      try {
        textAnalysisTool(query);
      } catch (error) {
        console.error("\nError:", error);
      }
    }
  });
};
