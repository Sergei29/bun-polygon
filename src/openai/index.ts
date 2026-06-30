import { OpenAI, OpenAIEmbedding } from "@llamaindex/openai";

export const openai = new OpenAI({
  model: "gpt-3.5-turbo",
  apiKey: process.env.OPENAI_API_KEY,
});

export const openaiChatJsonObject = new OpenAI({
  model: "gpt-3.5-turbo",
  apiKey: process.env.OPENAI_API_KEY,
  additionalChatOptions: {
    response_format: { type: "json_object" },
  },
});

export const openaiEmbedding = new OpenAIEmbedding({
  model: "text-embedding-ada-002",
  apiKey: process.env.OPENAI_API_KEY,
});
