"use client";

import { useEffect, Component, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { ThreeRenderer } from "@json-render/react-three-fiber";
import { registry } from "@/lib/registry";
import Player from "@/components/game/Player";
import GroundPlane from "@/components/game/GroundPlane";
import { GameContext } from "@/contexts/GameContext";
import type { Spec } from "@json-render/core";
import * as THREE from "three";

// ---- Error Boundary ----
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class CanvasErrorBoundary extends Component<
  { children: ReactNode; spec: Spec | null },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; spec: Spec | null }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[CanvasErrorBoundary] Caught error:", error);
    console.error("[CanvasErrorBoundary] Component stack:", info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="max-w-lg p-6 text-center">
            <p className="text-red-400 font-mono text-sm mb-2">
              3D rendering error
            </p>
            <pre className="text-red-600 font-mono text-xs whitespace-pre-wrap break-all mb-4">
              {this.state.error?.message}
            </pre>
            {this.props.spec && (
              <details className="text-left">
                <summary className="text-gray-500 text-xs cursor-pointer">
                  Spec debug info
                </summary>
                <pre className="text-gray-600 font-mono text-[10px] mt-2 max-h-60 overflow-auto">
                  root: {this.props.spec.root}
                  {"\n"}elements: {Object.keys(this.props.spec.elements || {}).join(", ")}
                  {"\n"}types: {[...new Set(Object.values(this.props.spec.elements || {}).map((e: any) => e.type))].join(", ")}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---- Main GameCanvas ----
interface GameCanvasProps {
  spec: Spec | null;
  loading: boolean;
  isDialogFocused: boolean;
  onZoneEnter?: (zoneId: string) => void;
  onInteract?: (objectName: string, position: [number, number, number]) => void;
}

/**
 * Main game canvas — raw R3F Canvas with Rapier physics.
 * Renders the json-render spec via ThreeRenderer, with a Player controller
 * that's always present (not part of the LLM-generated spec).
 *
 * Follows the game-engine example pattern:
 * Canvas > Physics > ThreeRenderer + Player
 */
export default function GameCanvas({
  spec,
  loading,
  isDialogFocused,
  onZoneEnter,
  onInteract,
}: GameCanvasProps) {
  useEffect(() => {
    console.log(
      "[GameCanvas] spec changed:",
      spec
        ? `root=${spec.root}, ${Object.keys(spec.elements || {}).length} elements, types: ${[...new Set(Object.values(spec.elements || {}).map((e: any) => e.type))].join(", ")}`
        : "null",
      "loading:",
      loading
    );
  }, [spec, loading]);

  return (
    <div className="absolute inset-0">
      <CanvasErrorBoundary spec={spec}>
        <Canvas
          shadows
          style={{ width: "100vw", height: "100vh" }}
          camera={{ fov: 60, near: 0.1, far: 1000, position: [0, 3, 8] }}
          onCreated={(state) => {
            // Set a dark scene background so objects are visible
            state.scene.background = new THREE.Color("#0a0a0f");
            console.log("[Canvas] R3F Canvas created successfully");
          }}
        >
          {/* Strong fallback lighting so generated scenes stay visible */}
          <ambientLight intensity={0.45} color="#cfd6ff" />
          <directionalLight
            position={[6, 12, 8]}
            intensity={1.1}
            color="#f5f1e8"
            castShadow
          />
          <pointLight position={[0, 4, 6]} intensity={1.4} distance={24} color="#ffd7a8" />
                    <Physics gravity={[0, -9.81, 0]}>
            <GroundPlane size={500} color="#0b1116" position={[0, -0.02, 0]} />
            {/* LLM-generated scene (should include its own lights, fog, etc.) */}
            <GameContext.Provider value={{ onZoneEnter, onInteract }}>
              {spec && (
                <ThreeRenderer spec={spec} registry={registry as any} />
              )}
            </GameContext.Provider>
            {/* Player is always present — not part of the spec */}
            <Player
              position={[0, 2, 8]}
              isDialogFocused={isDialogFocused}
            />
          </Physics>
        </Canvas>
      </CanvasErrorBoundary>
      {!spec && !loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-gray-500 font-mono text-sm">
            Initializing Mind Game...
          </p>
        </div>
      )}
      {!spec && loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-gray-400 font-mono text-sm animate-pulse">
            The world is forming...
          </div>
        </div>
      )}
      {loading && spec && (
        <div className="absolute top-4 right-4 text-gray-500 font-mono text-xs animate-pulse">
          generating...
        </div>
      )}
      {!isDialogFocused && (
        <div className="absolute top-4 left-4 text-gray-400 font-mono text-xs bg-black/50 p-2 rounded pointer-events-none">
          Click to look around &middot; WASD to move &middot; Space to jump
        </div>
      )}
    </div>
  );
}
