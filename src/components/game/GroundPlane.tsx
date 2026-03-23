"use client";

import { RigidBody, CuboidCollider } from "@react-three/rapier";

interface GroundPlaneProps {
  size?: number;
  color?: string;
  position?: [number, number, number];
}

/**
 * Physics-enabled ground plane. Always static.
 * Uses a CuboidCollider for a flat, walkable surface.
 */
export default function GroundPlane({
  size = 200,
  color = "#2a2a2a",
  position = [0, 0, 0],
}: GroundPlaneProps) {
  return (
    <RigidBody type="fixed" position={position}>
      <CuboidCollider args={[size / 2, 0.1, size / 2]} position={[0, -0.1, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  );
}
