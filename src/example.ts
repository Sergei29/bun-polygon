import { Document, VectorStoreIndex, SimpleDirectoryReader } from "llamaindex";
import path from "path";

export async function getRAG(query: string) {
  const directoryPath = path.join(process.cwd(), "src/data");
  const documents = await new SimpleDirectoryReader().loadData({
    directoryPath,
  });
  const indexStore = await VectorStoreIndex.fromDocuments(documents);

  const queryEngine = indexStore.asQueryEngine();

  const stream = await queryEngine.query({
    query,
    stream: true,
  });

  console.log("\n");

  for await (const chunk of stream) {
    process.stdout.write(chunk.toString());
  }
  console.log("\n");
}

export function run() {
  process.stdin.on("data", async (chunk) => {
    await getRAG(chunk.toString());
  });
}
