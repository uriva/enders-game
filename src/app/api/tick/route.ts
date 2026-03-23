import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import type { GameState } from "@/types/game";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

const ResponseSchema = z.object({
  dialog: z
    .string()
    .describe("Short ambient narration of what the creatures are doing.")
    .optional(),
  spec: z
    .object({
      root: z.string(),
      elements: z.record(
        z.string(),
        z.object({
          type: z.string(),
          props: z.record(z.string(), z.any()).nullable().optional(),
          children: z.array(z.string()).optional(),
        })
      ),
    })
    .describe("The fully updated JSON spec with modified entity positions"),
});

const BLOCKED_COMPONENT_TYPES = new Set([
  "EffectComposer",
  "Bloom",
  "Vignette",
  "Glitch",
]);

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, sanitizeValue(v)])
    );
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^math\./i.test(trimmed) || /infinity|nan/i.test(trimmed)) return 0;
  }
  return value;
}

export async function POST(request: Request) {
  try {
    const { gameState, currentSpec } = await request.json() as {
      gameState: GameState;
      currentSpec: any;
    };

    if (!currentSpec) {
      return Response.json({ error: "No spec provided" }, { status: 400 });
    }

    const prompt = `You are the "Creatures AI" for the Mind Game.
The player is currently idle, but the world is ALIVE. Time is passing.

CURRENT SCRIPT DIRECTIVE:
${gameState.narrative || "None"}

CURRENT SCENE SPEC:
\`\`\`json
${JSON.stringify(currentSpec)}
\`\`\`

YOUR JOB:
1. Identify "creatures", moving platforms, or dynamic entities in the scene (look for objects nested in Float/Orbit, or things that aren't walls/floors).
2. Slightly modify their positions, rotations, or colors to simulate life and movement. If they are creatures, make them slowly drift towards or away from the player (player is at [0,2,8]).
3. DO NOT add or remove structural elements (walls, lights, triggers). DO NOT regenerate the world.
4. You may return a short ambient dialog line (e.g. "A shape shifts in the shadows...") if the creatures do something noticeable. The dialog should align with the SCRIPT DIRECTIVE.

Return the COMPLETE modified JSON spec.`;

    const result = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: ResponseSchema,
      prompt,
    });

    const output = result.object;

    // Sanitize
    const elements = Object.fromEntries(
      Object.entries(output.spec.elements)
        .filter(([, el]) => !BLOCKED_COMPONENT_TYPES.has(el.type))
        .map(([id, el]) => [
          id,
          {
            ...el,
            props: sanitizeValue(el.props ?? {}),
            children: (el.children ?? []).filter(
              (childId) => !BLOCKED_COMPONENT_TYPES.has(output.spec.elements[childId]?.type)
            ),
          },
        ])
    );

    return Response.json({
      dialog: output.dialog,
      spec: { ...output.spec, elements },
    });
  } catch (error) {
    console.error("Tick generation error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
