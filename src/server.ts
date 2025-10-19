import { serve } from "bun";
import { GoogleGenAI } from "@google/genai";
import homepage from "../public/index.html";

const appPort = process.env.APP_PORT;
const apiKey = process.env.GEMINI_API_KEY;
const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash"; // Default model

const server = serve({
  routes: {
    // ** HTML imports **
    // Bundle & route index.html to "/".
    // This uses HTMLRewriter to scan the HTML for `<script>` and `<link>` tags, run's Bun's JavaScript & CSS bundler on them,
    // transpiles any TypeScript, JSX, and TSX, downlevels CSS with Bun's CSS parser and serves the result.
    "/": homepage,

    // ** API endpoints ** (Bun v1.2.3+ required)
    "/api/chat": {
      async POST(req) {
        // Define type for chat messages within the scope of the POST method
        interface ChatMessage {
          role: "user" | "model";
          text: string;
        }

        // Initialize the GoogleGenAI client and model name within this handler.
        if (!apiKey) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "Environment variable for GEMINI_API_KEY is not set.",
              data: null,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        const ai = new GoogleGenAI({ apiKey });

        try {
          // The original code had two attempts to parse the body: req.body.conversation and req.json().
          // For Bun's HTTP server, req.json() parses the entire body.
          const body: { conversation?: ChatMessage[] } = await req.json();
          const conversation = body.conversation;

          // satpam #1: Cek conversation apakah berupa array atau tidak
          // And also check if 'conversation' property exists in the body
          if (!conversation || !Array.isArray(conversation)) {
            return new Response(
              JSON.stringify({
                success: false,
                message: "Payload harus memiliki 'conversation' sebagai array!",
                data: null,
              }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          // satpam #2: Cek setiap pesan dalam conversation, apakah valid atau tidak
          let messageIsValid = true;

          if (conversation.length === 0) {
            return new Response(
              JSON.stringify({
                success: false,
                message: "Conversation tidak boleh kosong!",
                data: null,
              }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          // Using a for...of loop to allow breaking early if an invalid message is found
          for (const message of conversation) {
            // Kondisi #1 -- message harus berupa object dan bukan `null`
            if (!message || typeof message !== "object") {
              messageIsValid = false;
              break;
            }

            const keys = Object.keys(message);
            const objectHasValidKeys = keys.every((key) =>
              ["text", "role"].includes(key),
            );

            // Kondisi #2 -- message harus punya struktur yang valid (exactly 2 keys: 'text' and 'role')
            if (keys.length !== 2 || !objectHasValidKeys) {
              messageIsValid = false;
              break;
            }

            // Type assertion for safe property access and type checking
            const { text, role } = message as ChatMessage;

            // Kondisi 3A -- role harus valid ('model' or 'user')
            if (!["model", "user"].includes(role)) {
              messageIsValid = false;
              break;
            }

            // Kondisi 3B -- text harus valid (a non-empty string)
            if (typeof text !== "string" || text.trim() === "") {
              messageIsValid = false;
              break;
            }
          }

          if (!messageIsValid) {
            return new Response(
              JSON.stringify({
                success: false,
                message:
                  "Message harus valid! Setiap pesan harus memiliki 'text' (string tidak kosong) dan 'role' ('user' atau 'model').",
                data: null,
              }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          // proses dagingnya (AI generation)
          const contents = conversation.map(({ role, text }) => ({
            role,
            parts: [{ text }],
          }));

          const aiResponse = await ai.models.generateContent({
            model: geminiModel,
            contents,
            config: {
              systemInstruction:
                "Harus membalas dengan bahasa yang santai tetapi sopan dan tidak terlalu panjang.",
            },
          });

          // Access the generated text correctly from the response
          const responseText = aiResponse.text;

          // Return a Bun Response object for success
          return new Response(
            JSON.stringify({
              success: true,
              message: "Berhasil dibalas oleh Google Gemini!",
              data: responseText,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (e: unknown) {
          // Catch block variable 'e' is typed as 'unknown'
          // Construct an error message from 'e'
          let errorMessage = "Terjadi kesalahan internal server.";
          let statusCode = 500;

          if (e instanceof Error) {
            errorMessage = e.message;
          } else if (
            typeof e === "object" &&
            e !== null &&
            "message" in e &&
            typeof (e as any).message === "string"
          ) {
            // Fallback for objects that have a 'message' property but are not instances of Error
            errorMessage = (e as any).message;
          }

          // Return a Bun Response object for errors
          return new Response(
            JSON.stringify({
              success: false,
              message: errorMessage,
              data: null,
            }),
            {
              status: statusCode,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
    // "/api/users/:id": async req => {
    //   const { id } = req.params;
    //   return Response.json(user);
    // },
  },

  // Enable development mode for:
  // - Detailed error messages
  // - Hot reloading (Bun v1.2.3+ required)
  development: process.env.NODE_ENV === "development",
  port: appPort,
});

console.log(`Listening on ${server.url}`);
