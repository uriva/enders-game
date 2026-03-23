import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import type { GameState } from "@/types/game";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gameState, action, currentSpec } = body as {
      gameState: GameState;
      action: string | null;
      currentSpec?: any;
    };

    const prompt = `You are the Scriptwriter for the "Mind Game". 
Your job is to analyze the player's recent actions and the current state of the world, and output a hidden narrative/logic document.
This document will not be seen by the player, but will be fed to a faster "Director" AI to guide its instantaneous 3D modifications.

SEED: "${gameState.seed}"
TURN: ${gameState.turnCount}
CURRENT PSYCHOLOGY: ${JSON.stringify(gameState.psychProfile)}
PREVIOUS SCRIPT: ${gameState.narrative || "None yet."}
LATEST ACTION: ${action || "Player just entered the world."}

Analyze what the player is doing and what the world currently is.
Write a 2-3 paragraph "script brief" that explains:
1. What this specific world/space actually is symbolically or mechanically.
2. What the hidden rules or traps are.
3. Where the story should go next based on their psychology and actions.

Keep it concise, highly imaginative, and give strict, actionable directives to the Director (e.g. "The world is a manifestation of their guilt. If they touch the red boxes, start closing the walls.").`;

    const result = await generateText({
      model: google("gemini-2.5-pro"),
      prompt,
    });

    return Response.json({ narrative: result.text });
  } catch (error) {
    console.error("Narrative generation error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
