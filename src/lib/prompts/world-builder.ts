import type { GameState } from "@/types/game";

export function buildInitialWorldPrompt(state: GameState): string {
  const { seed } = state;

  return `Generate an introductory scene for the Mind Game.

SEED: "${seed}" — use this to inspire a unique atmospheric world. Different seeds should produce meaningfully different architectures (e.g. a labyrinthine dungeon, narrow overgrown forest paths, a series of metallic space-station corridors, or a cramped crystalline cave).

RULES:
- DO NOT create a vast, open, empty space. ALWAYS build enclosed, structured environments (corridors, rooms, thick forests) with walls, floors, and ceilings/ceilings-equivalents. Give the player a clear sense of progression or a path to follow. The player should not be staring into a void.
- DO NOT include a GroundPlane. The engine already provides an infinite GroundPlane at y=0.
- Place 1-3 TriggerVolume elements near doorways, narrow passages, or points of interest to detect player movement and trigger the next event.
- Place interactive objects, obstacles, and CREATURES. You can use GameLogic to make them move!
- CRITICAL DIALOG RULE: NEVER narrate sensory things (sights, sounds, temperature, smells). DO NOT say "A glowing orb sits before you" or "You hear a distant humming." If you want a sound, generate a ProceduralAudio component. If you want a sight, generate it in the spec. The dialog must ONLY be abstract psychological thoughts, a mysterious voice speaking directly to the player, or dialogue from characters. 
- Player spawns at [0, 2, 8] facing toward origin [0,0,0]. Make sure the path leads forward.

ATMOSPHERE:
- Set a distinct color palette based on the seed.
- Include exactly one ProceduralAudio component set to a fitting mood (ethereal, ominous, calm, etc.).
- Use Fog to establish claustrophobia or atmosphere (near: 2, far: 30-50).
- Include dramatic lighting: dim AmbientLight + focused SpotLight or DirectionalLight guiding the way.

SCENE LAYOUT:
- Ground level at y=0.
- Use GameBox to build walls, pillars, or dense objects to enclose the space and form corridors or rooms. ALWAYS BUILD STRUCTURES so the world is not empty!
- Don't build things floating too high unless there are ramps/stairs (player jumps 1 unit, is 1.5 units tall).`;
}

export function buildWorldActionPrompt(
  state: GameState,
  action: string,
  currentSpec?: any
): string {
  const { seed, psychProfile, narrative, turnCount } = state;

  const basePrompt = `The player is exploring a surreal, evolving enclosed world.

SEED: "${seed}"
TURN: ${turnCount}
PSYCHOLOGICAL PROFILE:
- Aggression: ${psychProfile.aggression.toFixed(2)}
- Curiosity: ${psychProfile.curiosity.toFixed(2)}
- Empathy: ${psychProfile.empathy.toFixed(2)}
- Defiance: ${psychProfile.defiance.toFixed(2)}
- Persistence: ${psychProfile.persistence.toFixed(2)}
- Creativity: ${psychProfile.creativity.toFixed(2)}

DIRECTIVE FROM THE SCRIPTWRITER: 
${narrative || "The player has entered the world. Introduce them to the central mystery."}

PLAYER ACTION: "${action}"

You are the DIRECTOR. Follow the Scriptwriter's directive closely.
Generate the updated scene reflecting the player's action and the Scriptwriter's logic.
- PROGRESSIVE MODIFICATION: You must preserve the existing JSON structure as much as possible, BUT the world MUST evolve according to the script.
- EVOLUTION & MECHANICS: When the player acts, interacts ('E'), or moves into a zone, change the environment! Make doors open, teleport them via a portal, trigger traps, or morph the walls. Invent mechanics and logic puzzles based on the Scriptwriter's theme using GameLogic and TriggerVolumes!
- CRITICAL DIALOG RULE: NEVER narrate sensory things (sights, sounds, physical changes). DO NOT say "A corridor opens", "The orb pulses", "You hear a loud crash". You must GENERATE those things in the spec (using ProceduralAudio for sound, GameLogic for pulsing/movement). The dialog must ONLY be spoken words from a narrator/entity or abstract thoughts. Let the player experience the sensory things through the 3D world, not text.
- Ensure the environment remains structured (corridors, rooms, paths). Don't let it become an empty world. ALWAYS generate walls, ceilings, and paths using GameBox or other shapes.
- CONSISTENCY: Maintain the current hour of day (lighting angles, fog colors) and the musical mood (ProceduralAudio) to some extent. Let them evolve gradually or logically, rather than jumping abruptly from day to night or calm to tense, unless the player's action warrants a sudden shock.
- DO NOT include a GroundPlane.`;

  if (currentSpec) {
    return `${basePrompt}

CURRENT SCENE JSON SPECIFICATION:
\`\`\`json
${JSON.stringify(currentSpec)}
\`\`\`
Return the FULL updated JSON specification (incorporating your changes). Do not truncate it. Make sure to keep the scene filled with structures!`;
  }

  return basePrompt;
}
