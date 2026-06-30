import { Settings, VectorStoreIndex, PromptTemplate } from "llamaindex";
import { SimpleDirectoryReader } from "@llamaindex/readers/directory";

import path from "path";
import { openai, openaiEmbedding } from "@/openai";

Settings.llm = openai;
Settings.embedModel = openaiEmbedding;

export async function main() {
  const directoryPath = path.join(process.cwd(), "src/data");
  const reader = new SimpleDirectoryReader();

  // Load files out of your local directory
  const documents = await reader.loadData({
    directoryPath,
  });

  const indexStore = await VectorStoreIndex.fromDocuments(documents);
  const queryEngine = indexStore.asQueryEngine();

  const customQAPrompt = new PromptTemplate({
    templateVars: ["context", "query"],
    template: `Use the context below
        Context: {context}
        Answer the question, and also include some random facts about lions and elephants in Africa taken from your training data.
        Question: {query}
        Answer:`,
  });

  queryEngine.updatePrompts({
    "responseSynthesizer:textQATemplate": customQAPrompt,
  });

  const response = await queryEngine.query({
    query: "Who are the news writers?",
  });

  console.log("response.toString()  :>> ", response.toString());
}
