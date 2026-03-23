"use client";

import { useRef, useMemo, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface GameLogicProps {
  code?: string;
  children?: ReactNode;
}

export default function GameLogic({ code = "", children }: GameLogicProps) {
  const ref = useRef<THREE.Group>(null);
  
  const executeLogic = useMemo(() => {
    if (!code) return null;
    try {
      // Provide a safe-ish context with access to THREE math
      return new Function("ref", "state", "delta", "THREE", `
        try {
          ${code}
        } catch (e) {
          console.error("GameLogic execution error:", e);
        }
      `);
    } catch (e) {
      console.error("GameLogic compilation error:", e);
      return null;
    }
  }, [code]);

  useFrame((state, delta) => {
    if (ref.current && executeLogic) {
      executeLogic(ref.current, state, delta, THREE);
    }
  });

  return <group ref={ref}>{children}</group>;
}
