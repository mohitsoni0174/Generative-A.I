import { ChatGroq } from "@langchain/groq";
import { createInterface } from "node:readline/promises";
import "dotenv/config";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.2,
});

const messages = [];

try {
  console.log("\nCLI Agent");
  console.log("Type 'exit' to quit.\n");

  while (true) {
    const userInput = await rl.question("You: ");

    messages.push({ role: "user", content: userInput });

    if (userInput.trim().toLowerCase() === "exit") {
      console.log("Agent: Goodbye!");
      break;
    }

    if (!userInput.trim()) continue;

    process.stdout.write("AI: ");

    const stream = await model.stream(messages);
    let assistantResponse = "";

    for await (const chunk of stream) {
      process.stdout.write(String(chunk.content ?? ""));
      assistantResponse += chunk.content ?? "";
    }
    messages.push({ role: "assistant", content: assistantResponse });

    console.log("\n");
  }
} catch (error) {
  console.error("\nError:", error.message);
} finally {
  rl.close();
}
