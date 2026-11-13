
import { ChatGroq } from "@langchain/groq";
import { createInterface } from "node:readline/promises";
import { tool, createAgent } from "langchain";
import { z } from "zod";
import "dotenv/config";

// Store events
const events = [];

// Tool: Create an event
const createEventTool = tool(
  async function ({ date, title, description }) {
    events.push({ date, title, description });
    return `Event "${title}" created successfully!`;
  },
  {
    name: "create_event",
    description:
      "Creates a new event with the given date, title, and description.",
    schema: z.object({
      date: z.string().describe("The date in YYYY-MM-DD format."),
      title: z.string().describe("The title of the event."),
      description: z.string().describe("A brief event description."),
    }),
  }
);

// Tool: Retrieve all events
const getEventsTool = tool(
  async function () {
    if (events.length === 0) {
      return "No events found.";
    }

    return JSON.stringify(events, null, 2);
  },
  {
    name: "get_events",
    description: "Retrieves a list of all created events.",
    schema: z.object({}),
  }
);

// Initialize terminal interface
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Initialize Groq model
const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.2,
});

// Create agent with tools
const agent = createAgent({
  model,
  tools: [createEventTool, getEventsTool],
});

// Conversation history
const messages = [];

try {
  console.log("\nEvent Management CLI Agent");
  console.log("Type 'exit' to quit.\n");

  while (true) {
    const userInput = await rl.question("You: ");
    const input = userInput.trim();

    if (input.toLowerCase() === "exit") {
      console.log("Agent: Goodbye!");
      break;
    }

    if (!input) continue;

    messages.push({
      role: "user",
      content: input,
    });

    process.stdout.write("AI: ");

    const stream = await agent.stream(
      { messages },
      { streamMode: "messages" }
    );

    let assistantResponse = "";

    for await (const [chunk, metadata] of stream) {
      const content = chunk.content;

      if (typeof content === "string" && content) {
        process.stdout.write(content);
        assistantResponse += content;
      }
    }

    messages.push({
      role: "assistant",
      content: assistantResponse,
    });

    console.log("\n");
  }
} catch (error) {
  console.error("\nError:", error.message);
} finally {
  rl.close();
}
