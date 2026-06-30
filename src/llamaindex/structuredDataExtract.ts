import { openaiChatJsonObject } from "@/openai";
import { transcript } from "@/data/transcript";

const example = {
  summary:
    "High-level summary of the call transcript. Should not exceed 3 sentences.",
  issues_reported: ["issue 1", "issue 2"],
  rep_name: "Name of the representative",
  customer_name: "Name of the customer, if not provided then use 'Customer'",
  sentiment: "Overall sentiment of the customer",
  suggested_improvements: ["suggestion 1", "suggestion 2"],
  follow_up_actions: ["action item 1", "action item 2"],
};

export async function structuredDataExtract() {
  const response = await openaiChatJsonObject.chat({
    messages: [
      {
        role: "system",
        content: `You are an expert assistant for analyzing and extracting insights from customer support call transcripts.\n\n
        Generate a valid JSON object in the following format:\n\n
        ${JSON.stringify(example)}
        `,
      },
      {
        role: "user",
        content: `Here is the transcript: \n------\n${transcript}\n------`,
      },
    ],
  });

  console.log("response :>> ", response.message.content);
}
