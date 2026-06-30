import { Document, Settings, VectorStoreIndex, MetadataMode } from "llamaindex";
import fs from "fs/promises";
import { openai, openaiEmbedding } from "@/openai";

Settings.llm = openai;
Settings.embedModel = openaiEmbedding;

export async function main() {
  const path = "node_modules/llamaindex/examples/abramov.txt";
  const essay = await fs.readFile(path, { encoding: "utf-8" });

  // Create Document object with essay
  const document = new Document({ text: essay, id_: path });

  // Split text and create embeddings. Store them in a VectorStoreIndex
  const index = await VectorStoreIndex.fromDocuments([document]);

  // Query the index
  const queryEngine = index.asQueryEngine();

  const response = await queryEngine.query({
    query: "When did the author come to the US?",
  });

  // Output response
  console.log(response.message);

  if (response.sourceNodes) {
    console.log("Source nodes:");
    for (const node of response.sourceNodes) {
      console.log(
        `Node ID: ${node.node.id_}, Score: ${node.score}, Content: ${node.node.getContent(MetadataMode.NONE).slice(0, 50)}... \n`,
      );
    }
  }
}
