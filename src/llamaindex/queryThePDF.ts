import { Document, Settings, VectorStoreIndex } from "llamaindex";
import { PDFReader } from "@llamaindex/readers/pdf";
import path from "path";
import { openai, openaiEmbedding } from "@/openai";

Settings.llm = openai;
Settings.embedModel = openaiEmbedding;

export async function queryThePDF(query: string) {
  const pathToPdf = path.join(
    process.cwd(),
    "src/data",
    "new-innovation-economy-conversation-nvidia-ceo-jensen-huang_Transcript_GC25.pdf",
  );
  const reader = new PDFReader();
  const documents = await reader.loadData(pathToPdf);
  const indexStore = await VectorStoreIndex.fromDocuments(documents);

  const queryEngine = indexStore.asQueryEngine();
  const stream = await queryEngine.query({
    query,
    stream: true,
  });

  console.log("\n");

  for await (const chunk of stream) {
    process.stdout.write(chunk.delta);
  }
  console.log("\n");
}

export function run() {
  process.stdin.on("data", async (chunk) => {
    const query = chunk.toString();
    await queryThePDF(query);
  });
}
