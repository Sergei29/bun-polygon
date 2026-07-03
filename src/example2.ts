import {
  VectorStoreIndex,
  SimpleDirectoryReader,
  OpenAI,
  OpenAIEmbedding,
  serviceContextFromDefaults,
  SimpleResponseBuilder,
  ResponseSynthesizer,
  VectorIndexRetriever,
  RetrieverQueryEngine,
} from "llamaindex";
import path from "path";

/**
 * WITH CUSTOM PROMPT
 */

export async function getRAG(query: string) {
  const directoryPath = path.join(process.cwd(), "src/data");
  const documents = await new SimpleDirectoryReader().loadData({
    directoryPath,
  });
  const indexStore = await VectorStoreIndex.fromDocuments(documents);
  const customLLM = new OpenAI();
  const customEmbedding = new OpenAIEmbedding();
  const serviceContext = serviceContextFromDefaults({
    llm: customLLM,
    embedModel: customEmbedding,
  });
  const customPrompt = function name({
    context = "",
    query = "",
  }: {
    query?: string;
    context?: string;
  }) {
    return `Context information is below:
    ---
    ${context}
    ---
    Given the context information, answer the query.
    Include a random fact about Albert Einstein from your training data.
    Query: ${query}
    Answer:`;
  };
  const customResponseBuilder = new SimpleResponseBuilder(
    serviceContext,
    customPrompt,
  );
  const customSynthesizer = new ResponseSynthesizer({
    responseBuilder: customResponseBuilder,
    serviceContext,
  });
  const customRetriever = new VectorIndexRetriever({
    index: indexStore,
  });

  const customQueryEngine = new RetrieverQueryEngine(
    customRetriever,
    customSynthesizer,
  );

  const stream = await customQueryEngine.query({
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
    const query = chunk.toString();
    await getRAG(chunk.toString());
  });
}
