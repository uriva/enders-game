import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, Output } from "ai";
import { z } from "zod";
import { buildSystemPrompt } from "@/lib/prompts/system";
import {
  buildGiantsDrinkPrompt,
  buildGiantsDrinkActionPrompt,
} from "@/lib/prompts/giants-drink";
import type { GameState } from "@/types/game";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

const ResponseSchema = z.object({
  dialog: z
    .string()
    .describe(
      "NPC speech, narration, or scene description shown to the player"
    ),
  spec: z
    .object({
      root: z.string().describe("ID of the root element"),
      elements: z
        .record(
          z.string(),
          z.object({
            type: z.string().describe("Component type from the catalog"),
            props: z
              .record(z.string(), z.any())
              .describe("Component props")
              .nullable()
              .optional(),
            children: z
              .array(z.string())
              .describe("IDs of child elements")
              .optional(),
          })
        )
        .describe("Map of element ID to element definition"),
    })
    .describe("json-render spec for the 3D scene"),
  psychUpdate: z
    .object({
      aggression: z.number().min(-0.1).max(0.1).optional(),
      curiosity: z.number().min(-0.1).max(0.1).optional(),
      empathy: z.number().min(-0.1).max(0.1).optional(),
      defiance: z.number().min(-0.1).max(0.1).optional(),
      persistence: z.number().min(-0.1).max(0.1).optional(),
      creativity: z.number().min(-0.1).max(0.1).optional(),
    })
    .describe(
      "Incremental updates to psychological profile based on this action (-0.1 to +0.1)"
    )
    .optional(),
  sceneTransition: z
    .enum(["none", "death", "beyond"])
    .describe(
      "Whether this action causes a scene transition: none=stay, death=player dies, beyond=giant defeated"
    )
    .optional(),
});

const ALLOWED_PSYCH_KEYS = new Set([
  "aggression",
  "curiosity",
  "empathy",
  "defiance",
  "persistence",
  "creativity",
]);

const BLOCKED_COMPONENT_TYPES = new Set([
  "EffectComposer",
  "Bloom",
  "Vignette",
  "Glitch",
]);

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, sanitizeValue(item)])
    );
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^math\./i.test(trimmed) || /infinity|nan/i.test(trimmed)) {
      return 0;
    }
  }

  return value;
}

function sanitizeOutput(output: z.infer<typeof ResponseSchema>) {
  const elements = Object.fromEntries(
    Object.entries(output.spec.elements)
      .filter(([, element]) => !BLOCKED_COMPONENT_TYPES.has(element.type))
      .map(([id, element]) => [
        id,
        {
          ...element,
          props: sanitizeValue(element.props ?? {}),
          children: (element.children ?? []).filter(
            (childId) => !BLOCKED_COMPONENT_TYPES.has(output.spec.elements[childId]?.type)
          ),
        },
      ])
  );

  const psychUpdate = output.psychUpdate
    ? Object.fromEntries(
        Object.entries(output.psychUpdate).filter(([key]) =>
          ALLOWED_PSYCH_KEYS.has(key)
        )
      )
    : undefined;

  return {
    ...output,
    spec: {
      ...output.spec,
      elements,
    },
    psychUpdate,
  };
}

/**
 * Streaming endpoint for scene generation.
 *
 * Streams a custom JSONL protocol to the client:
 *   {"type":"dialog","text":"..."}   — progressive dialog text
 *   {"type":"result","data":{...}}   — final complete response (spec, psychUpdate, etc.)
 *   {"type":"error","message":"..."}  — error
 *
 * Dialog is sent as it becomes available from the partial object stream,
 * so the player sees text appearing while the full scene generates.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gameState, action } = body as {
      gameState: GameState;
      action: string | null;
    };

    // Build the appropriate user prompt
    let userPrompt: string;

    if (!action) {
      userPrompt = buildGiantsDrinkPrompt(gameState);
    } else if (gameState.scene === "giants_drink") {
      userPrompt = buildGiantsDrinkActionPrompt(gameState, action);
    } else {
      userPrompt = buildBeyondPrompt(gameState, action);
    }

    const systemPrompt = buildSystemPrompt();

    const result = streamText({
      model: google("gemini-2.5-flash"),
      output: Output.object({
        schema: ResponseSchema,
      }),
      providerOptions: {
        google: {
          structuredOutputs: false,
          thinkingConfig: {
            thinkingBudget: 1024,
          },
        },
      },
      system: systemPrompt,
      prompt: userPrompt,
    });

    const encoder = new TextEncoder();
    let lastDialogSent = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream partial objects — send dialog as it fills in
          for await (const partial of result.partialOutputStream) {
            if (partial.dialog && partial.dialog !== lastDialogSent) {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "dialog",
                    text: partial.dialog,
                  }) + "\n"
                )
              );
              lastDialogSent = partial.dialog;
            }
          }

          // Get the final complete output
          const output = await result.output;

          if (!output) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "error",
                  message: "Failed to generate scene",
                }) + "\n"
              )
            );
          } else {
            const sanitized = sanitizeOutput(output);
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ type: "result", data: sanitized }) + "\n"
              )
            );
          }
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "error",
                message: String(err),
              }) + "\n"
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Scene generation error:", error);
    return Response.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

function buildBeyondPrompt(state: GameState, action: string): string {
  const { seed, psychProfile, narrative, turnCount } = state;

  return `The player has defeated the Giant and is now exploring the world beyond.

SEED: "${seed}"
TURN: ${turnCount}
PSYCHOLOGICAL PROFILE:
- Aggression: ${psychProfile.aggression.toFixed(2)}
- Curiosity: ${psychProfile.curiosity.toFixed(2)}
- Empathy: ${psychProfile.empathy.toFixed(2)}
- Defiance: ${psychProfile.defiance.toFixed(2)}
- Persistence: ${psychProfile.persistence.toFixed(2)}
- Creativity: ${psychProfile.creativity.toFixed(2)}

NARRATIVE SO FAR: ${narrative || "The player just defeated the Giant and entered the world beyond."}

PLAYER ACTION: "${action}"

Generate the next scene. The world beyond should:
- Be surreal and dreamlike — a twisted fairyland
- Reflect the player's psychological profile (high aggression = more hostile environments, high curiosity = more mysterious/puzzle-rich, high empathy = more characters in need, etc.)
- Include interactive elements the player can engage with
- Build toward deeper psychological revelations
- May include NPCs, structures, landscapes, puzzles
- Should feel like it's reading the player's mind

Create a complete, atmospheric 3D scene that responds to the player's action and psychological state.`;
}
