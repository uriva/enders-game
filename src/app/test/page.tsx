"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { ThreeRenderer } from "@json-render/react-three-fiber";
import { registry } from "@/lib/registry";
import type { Spec } from "@json-render/core";

/**
 * Minimal spec — just a light and a colored box.
 * No custom game components, no physics.
 */
const MINIMAL_SPEC: Spec = {
  root: "scene",
  elements: {
    scene: {
      type: "Group",
      props: {},
      children: ["light", "box"],
    },
    light: {
      type: "AmbientLight",
      props: { intensity: 1 },
    },
    box: {
      type: "Box",
      props: { position: [0, 0, -3], color: "#ff0000" },
    },
  },
};

/**
 * Spec using our custom GameBox + GroundPlane.
 */
const GAME_SPEC: Spec = {
  root: "scene",
  elements: {
    scene: {
      type: "Group",
      props: {},
      children: ["ambient", "ground", "box1"],
    },
    ambient: {
      type: "AmbientLight",
      props: { intensity: 0.8 },
    },
    ground: {
      type: "GroundPlane",
      props: { size: 100, color: "#333" },
    },
    box1: {
      type: "GameBox",
      props: { position: [0, 1, -3], args: [2, 2, 2], color: "#ff4444", isStatic: true },
    },
  },
};

function BareCanvas() {
  return (
    <Canvas style={{ width: "100vw", height: "100vh" }} camera={{ position: [0, 2, 5] }}>
      <ambientLight intensity={1} />
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="red" />
      </mesh>
    </Canvas>
  );
}

function SpecNoPhysics() {
  return (
    <Canvas style={{ width: "100vw", height: "100vh" }} camera={{ position: [0, 2, 5] }}>
      <ThreeRenderer spec={MINIMAL_SPEC} registry={registry as any} />
    </Canvas>
  );
}

function GameSpecNoPhysics() {
  return (
    <Canvas style={{ width: "100vw", height: "100vh" }} camera={{ position: [0, 2, 5] }}>
      <ThreeRenderer spec={GAME_SPEC} registry={registry as any} />
    </Canvas>
  );
}

function GameSpecWithPhysics() {
  return (
    <Canvas style={{ width: "100vw", height: "100vh" }} camera={{ position: [0, 2, 5] }}>
      <Physics gravity={[0, -9.81, 0]}>
        <ThreeRenderer spec={GAME_SPEC} registry={registry as any} />
      </Physics>
    </Canvas>
  );
}

const TESTS = [
  { name: "1. Bare R3F Canvas (no json-render)", Component: BareCanvas },
  { name: "2. ThreeRenderer + built-in Box (no physics)", Component: SpecNoPhysics },
  { name: "3. ThreeRenderer + GameBox/GroundPlane (no physics)", Component: GameSpecNoPhysics },
  { name: "4. ThreeRenderer + GameBox/GroundPlane + Physics", Component: GameSpecWithPhysics },
];

export default function TestPage() {
  const [active, setActive] = useState<number | null>(null);

  if (active !== null) {
    const { name, Component } = TESTS[active];
    return (
      <div className="relative h-screen w-screen bg-black">
        <Component />
        <div className="absolute top-4 left-4 z-50 bg-black/80 p-3 rounded">
          <p className="text-green-400 font-mono text-xs mb-2">{name}</p>
          <button
            onClick={() => setActive(null)}
            className="text-gray-400 font-mono text-xs underline"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-black gap-4">
      <h1 className="text-white text-xl font-mono mb-4">Render Pipeline Tests</h1>
      <p className="text-gray-500 text-xs font-mono mb-4">
        Click each test in order. Open browser console for errors.
      </p>
      {TESTS.map((t, i) => (
        <button
          key={i}
          onClick={() => setActive(i)}
          className="border border-gray-700 px-6 py-2 text-gray-300 font-mono text-sm hover:bg-gray-900 w-96 text-left"
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}
