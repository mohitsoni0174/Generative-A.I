import { ChatGroq } from "@langchain/groq";

const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
  apiKey: process.env.OPENAI_API_KEY,
});
