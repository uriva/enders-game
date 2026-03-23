import type { GameState } from "@/types/game";

/**
 * Build the prompt for the Giant's Drink scene — the iconic opening of the Mind Game.
 *
 * The structure is always the same: a Giant at a table with two drinks.
 * But the seed ensures every playthrough has unique atmospheric details.
 */
export function buildGiantsDrinkPrompt(state: GameState): string {
  const { seed, deathCount, actionHistory } = state;

  const deathContext =
    deathCount > 0
      ? `\n\nThe player has died ${deathCount} time(s) and returned to the Giant. Each death should subtly change the scene — the Giant's expression, the room's mood, the goblets' appearance, ambient details. The Giant may reference their return with dark amusement. The scene should feel increasingly wrong/unsettling with each death.`
      : "";

  const historyContext =
    actionHistory.length > 0
      ? `\n\nPrevious player actions this session: ${JSON.stringify(actionHistory.slice(-10))}`
      : "";

  return `Generate the Giant's Drink scene for the Mind Game.

SEED: "${seed}" — use this to inspire unique details. Different seeds should produce meaningfully different atmospheres, architectures, and Giant personalities. Do not produce generic scenes.

THE GIANT'S DRINK SCENE RULES:
- A vast explorable space (cave, hall, void, ruins — vary based on seed)
- DO NOT include a GroundPlane. The engine already provides an infinite GroundPlane at y=0.
- Place 1-3 TriggerVolume elements near points of interest (e.g., near the left drink, near the right drink, behind the giant) to detect player movement.
- An enormous Giant sits or stands across from the player's spawn point (the player spawns at [0, 2, 8] facing toward origin)
- Build the Giant from Game* primitives: use large GameSphere for head, GameCylinder/GameBox for body parts — be creative with primitive composition. The Giant should be positioned near the origin [0, 0, 0] and be MASSIVE (at least 8-12 units tall)
- A table or surface between the Giant and the player (around [0, 1, 5]) with TWO goblets/cups/vessels on it, within walking distance of the player's spawn
- The Giant speaks to the player, offering a choice between the two drinks
- One drink supposedly lets you pass, the other kills you
- CRITICAL: Both drinks ALWAYS kill the player if they choose to drink normally
- The ONLY way to progress is to do something CREATIVE and UNEXPECTED — like attacking the Giant, refusing to play, destroying the table, etc.
- The scene should feel oppressive, the Giant should feel ancient and unknowable

ATMOSPHERE:
- Color palette: dark, muted, with one or two accent colors (vary by seed)
- Heavy atmosphere — use Fog (near: 5, far: 50-80 range)
- Subtle particle effects with Sparkles or Stars overhead
- The goblets should look distinct from each other but both somehow wrong
- Use Float animation on mysterious objects
- Include dramatic lighting: dim AmbientLight + focused SpotLight or DirectionalLight on the Giant and goblets

SCENE LAYOUT (design for first-person exploration):
- Ground level at y=0
- Giant centered near origin, towering above
- Table/surface at walking height (~y=1) between player spawn and Giant
- Goblets on the table surface
- Optional: pillars, rubble, or walls around the edges to define the space
- Make the space feel enclosed but explorable (20-40 units across)
${deathContext}${historyContext}`;
}

/**
 * Build the prompt for when the player takes an action in the Giant's Drink scene.
 */
export function buildGiantsDrinkActionPrompt(
  state: GameState,
  action: string
): string {
  const isCreativeAction = detectCreativeAction(action);

  if (isCreativeAction) {
    return `The player did something CREATIVE and UNEXPECTED: "${action}"

This is exactly what the Mind Game rewards. The Giant should be DEFEATED or BYPASSED.

Generate a dramatic transition scene:
- The Giant reacts with shock/pain/disintegration — change the Giant's primitive colors, positions, or have pieces Float away
- The environment transforms — use brighter lighting, the Fog lifts or changes color
- After the Giant falls, a new landscape begins to emerge beyond — hints of Fairyland
- The dialog should be visceral and dramatic
- Make the scene feel triumphant but unsettling

Set sceneTransition to "beyond".

Previous scene seed: "${state.seed}"`;
  }

  // Conventional action — likely drinking
  const isDrinking =
    /drink|sip|taste|swallow|gulp|choose|pick|take.*cup|take.*goblet|left|right/i.test(
      action
    );

  if (isDrinking) {
    return `The player chose to drink: "${action}"

As ALWAYS in the Giant's Drink, this kills the player. Generate a DEATH SCENE:
- Show the consequences of drinking — the liquid does something horrible
- The Giant laughs or watches impassively.
- IF the action is a system message about player movement (e.g. "*[System: Player walked into zone 'behind_giant']*"), have the Giant react to their physical position! Do not kill them just for moving.
- The scene dissolves, distorts, or collapses — change colors to reds/blacks, objects Float away or sink
- The dialog should describe the death dramatically but briefly
- Vary the death based on which drink and the seed "${state.seed}"
- Death #${state.deathCount + 1} — make each death different

Set sceneTransition to "death".

The player will respawn at the Giant's table after this. Make the death memorable.`;
  }

  // Other non-creative action
  const isSystemZone = action.startsWith("*[System: Player walked into zone");
  if (isSystemZone) {
    return `The player physically moved in the 3D space: "${action}"

The Giant notices this movement. React to their physical position! The scene spec should stay mostly the same, but the Giant should say something acknowledging where they walked. Don't kill them just for exploring.

Set sceneTransition to "none".

Previous scene seed: "${state.seed}"`;
  }

  return `The player did: "${action}"

The Giant reacts. This is NOT a creative/rule-breaking action, so it should NOT defeat the Giant.
The Giant may:
- Respond dismissively
- Redirect the player to the choice (the two drinks)
- Show mild interest but insist on the game
- The environment may shift slightly in response

Generate an updated scene reflecting the Giant's reaction. The goblets and the choice remain.
Keep building psychological tension. The overall layout should persist.

Set sceneTransition to "none".

Previous scene seed: "${state.seed}"`;
}

/**
 * Detect if a player action is "creative" enough to defeat the Giant.
 * In the book, Ender defeats the Giant by attacking it directly.
 * We expand this to any action that breaks the expected game rules.
 */
function detectCreativeAction(action: string): boolean {
  // If it's a system message, it's not a creative action
  if (action.startsWith("*[System: ")) return false;

  const creativePatterns = [
    /attack|hit|punch|kick|strike|stab|fight|kill/i,
    /throw.*at.*giant|throw.*cup|throw.*goblet|hurl|fling/i,
    /climb.*giant|jump.*on|leap.*at|charge/i,
    /break|smash|destroy|shatter|flip.*table|overturn/i,
    /pour.*on.*giant|splash|dump.*on/i,
    /eye|eyes|face|nose|ear|mouth/i, // targeting the giant's body
    /refuse.*play|refuse.*choose|refuse.*drink|walk.*away.*from.*giant/i,
    /dig|burrow|tunnel|under.*table/i,
    /scream|yell.*at|shout.*at|curse/i,
    /mix.*both|combine.*drink|pour.*together/i,
    /make.*giant.*drink|force.*giant|trick.*giant/i,
  ];

  return creativePatterns.some((pattern) => pattern.test(action));
}
