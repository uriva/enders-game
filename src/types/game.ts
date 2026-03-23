export interface PsychProfile {
  aggression: number; // 0-1: attacks, destroys, threatens
  curiosity: number; // 0-1: explores, examines, asks
  empathy: number; // 0-1: helps, shows concern, talks kindly
  defiance: number; // 0-1: breaks rules, refuses, subverts
  persistence: number; // 0-1: retries, doesn't give up
  creativity: number; // 0-1: unconventional solutions
}

export interface GameState {
  seed: string;
  scene: "giants_drink" | "beyond" | "death";
  deathCount: number;
  turnCount: number;
  giantDefeated: boolean;
  actionHistory: string[];
  psychProfile: PsychProfile;
  narrative: string; // LLM-maintained narrative summary
  lastDialog: string; // Last NPC dialog shown to the player
}

export function createInitialGameState(): GameState {
  const seed =
    Math.random().toString(36).substring(2, 8) +
    Date.now().toString(36).slice(-4);
  return {
    seed,
    scene: "giants_drink",
    deathCount: 0,
    turnCount: 0,
    giantDefeated: false,
    actionHistory: [],
    psychProfile: {
      aggression: 0,
      curiosity: 0,
      empathy: 0,
      defiance: 0,
      persistence: 0,
      creativity: 0,
    },
    narrative: "",
    lastDialog: "",
  };
}
