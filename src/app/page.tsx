"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import DialogBox from "@/components/DialogBox";
import { createInitialGameState, type GameState } from "@/types/game";
import type { Spec } from "@json-render/core";

// Dynamic import to avoid SSR issues with Three.js
const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
});

interface SceneResponse {
  dialog: string;
  spec: Spec;
  psychUpdate?: Partial<GameState["psychProfile"]>;
  sceneTransition?: "none" | "death" | "beyond";
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [spec, setSpec] = useState<Spec | null>(null);
  const [dialog, setDialog] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [isDialogFocused, setIsDialogFocused] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const initialized = useRef(false);
  const recentZones = useRef<Record<string, number>>({});
  const isTicking = useRef(false);

  // Autonomous Actor AI Loop
  // If the player is idle, have the world evolve slowly around them
  useEffect(() => {
    if (!started || loading || isDead || !spec || !gameState) return;

    const interval = setInterval(async () => {
      if (isTicking.current || loading) return;
      isTicking.current = true;
      
      try {
        console.log("[tick] Running autonomous actor AI...");
        const res = await fetch("/api/tick", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameState, currentSpec: spec }),
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.spec) {
            setSpec(data.spec);
          }
          if (data.dialog) {
            setDialog(data.dialog);
          }
        }
      } catch (e) {
        console.error("Tick failed", e);
      } finally {
        isTicking.current = false;
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [started, loading, isDead, spec, gameState]);

  /**
   * Stream a scene from the API via NDJSON.
   * Dialog lines are applied progressively as they arrive.
   * The final "result" line (containing the full spec) is buffered
   * across chunks to handle large payloads that split across reads.
   */
  const fetchScene = useCallback(
    async (
      state: GameState,
      action: string | null,
      currentSpec: Spec | null
    ): Promise<SceneResponse | null> => {
      setLoading(true);
      setDialog((prev) => prev || "The Mind Game is generating...");
      try {
        // Fire off background narrative generation (non-blocking)
        if (state.turnCount > 0 || action) {
          fetch("/api/narrative", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gameState: state, action, currentSpec }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.narrative) {
                console.log("[narrative] Updated hidden narrative rules:", data.narrative);
                setGameState((prev) => 
                  prev ? { ...prev, narrative: data.narrative } : prev
                );
              }
            })
            .catch((err) => console.error("Narrative update failed:", err));
        }

        const res = await fetch("/api/act", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameState: state, action, currentSpec }),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("API error:", res.status, text);
          setDialog("The Mind Game flickers... something went wrong.");
          return null;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setDialog("Connection to the Mind Game lost...");
          return null;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let result: SceneResponse | null = null;

        console.log("[stream] Starting to read NDJSON stream");

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("[stream] Stream ended. Buffer remaining:", buffer.length, "chars");
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Process all complete lines (terminated by \n)
          let newlineIdx: number;
          while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, newlineIdx).trim();
            buffer = buffer.slice(newlineIdx + 1);

            if (!line) continue;
            try {
              const msg = JSON.parse(line);
              if (msg.type === "dialog") {
                setDialog(msg.text);
              } else if (msg.type === "result") {
                console.log("[stream] Got result! spec root:", msg.data?.spec?.root, "elements:", Object.keys(msg.data?.spec?.elements || {}).length);
                result = msg.data as SceneResponse;
              } else if (msg.type === "error") {
                console.error("[stream] Error from server:", msg.message);
                setDialog("The Mind Game flickers... something went wrong.");
              }
            } catch {
              // Line is incomplete JSON — put it back and wait for more data
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }

        // Process any remaining data in buffer after stream ends
        const remaining = buffer.trim();
        if (remaining) {
          console.log("[stream] Processing remaining buffer:", remaining.length, "chars");
          try {
            const msg = JSON.parse(remaining);
            if (msg.type === "result") {
              console.log("[stream] Got result from remaining buffer!");
              result = msg.data as SceneResponse;
            } else if (msg.type === "dialog") {
              setDialog(msg.text);
            }
          } catch (e) {
            console.warn(
              "[stream] Failed to parse remaining buffer:",
              remaining.slice(0, 300),
              e
            );
          }
        }

        if (!result) {
          console.error("[stream] No result received from stream");
          setDialog(
            "The Mind Game lost its connection... try speaking again."
          );
        } else {
          console.log("[stream] Success! Setting spec with", Object.keys(result.spec?.elements || {}).length, "elements");
        }

        return result;
      } catch (err) {
        console.error("Fetch error:", err);
        setDialog("Connection to the Mind Game lost...");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const applyResponse = useCallback(
    (state: GameState, response: SceneResponse): GameState => {
      const next = { ...state };

      setDialog(response.dialog);
      next.lastDialog = response.dialog;

      // Update spec
      setSpec(response.spec);

      // Apply psych profile updates
      if (response.psychUpdate) {
        const profile = { ...next.psychProfile };
        for (const [key, delta] of Object.entries(response.psychUpdate)) {
          if (delta !== undefined && key in profile) {
            const k = key as keyof typeof profile;
            profile[k] = Math.max(0, Math.min(1, profile[k] + delta));
          }
        }
        next.psychProfile = profile;
      }

      // Handle scene transitions
      if (response.sceneTransition === "death") {
        next.deathCount += 1;
        next.scene = "death";
      } else if (response.sceneTransition === "beyond") {
        next.giantDefeated = true;
        next.scene = "exploration";
      }

      next.turnCount += 1;

      return next;
    },
    []
  );

  const startGame = useCallback(async () => {
    if (initialized.current) return;
    initialized.current = true;
    setStarted(true);

    const state = createInitialGameState();
    setGameState(state);

    // Check for ?test=1 URL param to use test scene (bypasses Gemini)
    const isTest = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("test");
    
    if (isTest) {
      console.log("[startGame] Using test scene (no LLM)");
      const testRes = await fetch("/api/test-scene");
      const reader = testRes.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let buffer = "";
        let result: SceneResponse | null = null;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 1);
            if (!line) continue;
            try {
              const msg = JSON.parse(line);
              if (msg.type === "dialog") setDialog(msg.text);
              else if (msg.type === "result") result = msg.data;
            } catch { break; }
          }
        }
        if (result) {
          console.log("[startGame] Test scene loaded:", Object.keys(result.spec?.elements || {}).length, "elements");
          const next = applyResponse(state, result);
          setGameState(next);
          return;
        }
      }
    }

    const response = await fetchScene(state, null, null);
    if (response) {
      const next = applyResponse(state, response);
      setGameState(next);
    }
  }, [fetchScene, applyResponse]);

  const handleAction = useCallback(
    async (action: string) => {
      if (!gameState || loading) return;

      const current = {
        ...gameState,
        actionHistory: [...gameState.actionHistory, action],
      };
      setGameState(current);

      const response = await fetchScene(current, action, spec);
      if (!response) return;

      // If the player died, show death scene briefly, then re-generate the world
      if (response.sceneTransition === "death") {
        const afterDeath = applyResponse(current, response);
        setGameState(afterDeath);

        // After a pause, regenerate the initial scene
        await new Promise((resolve) => setTimeout(resolve, 3000));
        
        setIsDead(true);
        setDialog("");
        
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Create a new seed so the world resets slightly differently
        const respawnState = {
          ...afterDeath,
          scene: "exploration" as const,
          seed: Math.random().toString(36).substring(2, 8),
          actionHistory: [],
        };
        
        const respawn = await fetchScene(respawnState, null, null);
        if (respawn) {
          const afterRespawn = applyResponse(respawnState, respawn);
          setGameState(afterRespawn);
        }
        setIsDead(false);
      } else {
        const next = applyResponse(current, response);
        // Update narrative for exploration scenes
        if (next.scene === "exploration") {
          next.narrative =
            (next.narrative ? next.narrative + " " : "") + response.dialog;
        }
        setGameState(next);
      }
    },
    [gameState, loading, fetchScene, applyResponse]
  );

  const handleInteract = useCallback((objectName: string, position: [number, number, number]) => {
    if (!gameState || loading) return;
    
    console.log(`[page] Player interacted with ${objectName} at`, position);
    
    const systemAction = `*[System: Player pressed 'E' to interact with an object visually similar to '${objectName}' at position [${position[0].toFixed(1)}, ${position[1].toFixed(1)}, ${position[2].toFixed(1)}]]*`;
    handleAction(systemAction);
  }, [gameState, loading, handleAction]);

  const handleZoneEnter = useCallback((zoneId: string) => {
    if (!gameState || loading) return;
    
    const now = Date.now();
    const lastTriggered = recentZones.current[zoneId] || 0;
    
    // Prevent re-triggering the same zone within 30 seconds
    if (now - lastTriggered < 30000) return;
    
    recentZones.current[zoneId] = now;
    console.log("[page] Player entered zone:", zoneId);
    
    const systemAction = `*[System: Player walked into zone '${zoneId}']*`;
    handleAction(systemAction);
  }, [gameState, loading, handleAction]);



  // Title screen
  if (!started) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-black">
        <div className="space-y-8 text-center">
          <h1 className="font-serif text-4xl tracking-wide text-gray-300">
            THE MIND GAME
          </h1>
          <p className="max-w-md font-mono text-sm leading-relaxed text-gray-600">
            A psychological exploration game. The game watches you as much as
            you play it. Every choice reveals something about who you are.
          </p>
          <button
            onClick={startGame}
            className="border border-gray-700/50 px-8 py-3 font-mono text-sm text-gray-400 transition-colors hover:border-gray-500 hover:text-gray-200"
          >
            Begin
          </button>
          <p className="font-mono text-[10px] tracking-widest text-gray-700 uppercase">
            International Fleet &mdash; Battle School
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-black">
      {isDead && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md transition-opacity duration-1000">
          <div className="text-center space-y-4">
            <h1 className="text-red-600 font-serif text-6xl tracking-widest uppercase">You Died</h1>
            <p className="text-gray-500 font-mono text-sm tracking-widest">The Mind Game resets...</p>
          </div>
        </div>
      )}
      <GameCanvas
        spec={spec}
        loading={loading}
        isDialogFocused={isDialogFocused}
        onZoneEnter={handleZoneEnter}
        onInteract={handleInteract}
      />
      <DialogBox
        dialog={dialog}
        onAction={handleAction}
        disabled={loading}
        deathCount={gameState?.deathCount ?? 0}
        scene={gameState?.scene ?? "exploration"}
        onFocusChange={setIsDialogFocused}
      />
    </div>
  );
}
