"use client";

import { type ReactNode } from "react";
import {
  RigidBody,
  CuboidCollider,
  BallCollider,
  CapsuleCollider,
} from "@react-three/rapier";

interface PhysicsProps {
  mass?: number;
  isStatic?: boolean;
  restitution?: number;
  friction?: number;
  colliderType?: "cuboid" | "ball" | "capsule" | "none";
}

interface PhysicsWrapperProps extends PhysicsProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  children: ReactNode;
  /** half-extents for cuboid, radius for ball, [halfHeight, radius] for capsule */
  colliderArgs?: number[];
}

/**
 * Wraps children in a RigidBody when a colliderType is specified.
 */
function PhysicsWrapper({
  position,
  rotation,
  mass = 1,
  isStatic = true,
  restitution = 0.2,
  friction = 0.5,
  colliderType = "none",
  colliderArgs,
  children,
}: PhysicsWrapperProps) {
  if (colliderType === "none") {
    return (
      <group position={position} rotation={rotation}>
        {children}
      </group>
    );
  }

  const collider =
    colliderType === "ball" ? (
      <BallCollider args={colliderArgs as [number]} />
    ) : colliderType === "capsule" ? (
      <CapsuleCollider args={colliderArgs as [number, number]} />
    ) : (
      <CuboidCollider args={colliderArgs as [number, number, number]} />
    );

  return (
    <RigidBody
      type={isStatic ? "fixed" : "dynamic"}
      position={position}
      rotation={rotation}
      mass={mass}
      restitution={restitution}
      friction={friction}
    >
      {collider}
      {children}
    </RigidBody>
  );
}

// ---- GameBox ----
interface GameBoxProps extends PhysicsProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  args?: [number, number, number]; // width, height, depth
  color?: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
  children?: ReactNode;
}

export function GameBox({
  position,
  rotation,
  args = [1, 1, 1],
  color = "#888",
  castShadow = true,
  receiveShadow = true,
  mass,
  isStatic,
  restitution,
  friction,
  colliderType = "cuboid",
  children,
}: GameBoxProps) {
  return (
    <PhysicsWrapper
      position={position}
      rotation={rotation}
      mass={mass}
      isStatic={isStatic}
      restitution={restitution}
      friction={friction}
      colliderType={colliderType}
      colliderArgs={[args[0] / 2, args[1] / 2, args[2] / 2]}
    >
      <mesh castShadow={castShadow} receiveShadow={receiveShadow}>
        <boxGeometry args={args} />
        <meshStandardMaterial color={color} />
      </mesh>
      {children}
    </PhysicsWrapper>
  );
}

// ---- GameSphere ----
interface GameSphereProps extends PhysicsProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  args?: [number, number?, number?]; // radius, widthSegments, heightSegments
  color?: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
  children?: ReactNode;
}

export function GameSphere({
  position,
  rotation,
  args = [0.5],
  color = "#888",
  castShadow = true,
  receiveShadow = true,
  mass,
  isStatic,
  restitution,
  friction,
  colliderType = "ball",
  children,
}: GameSphereProps) {
  return (
    <PhysicsWrapper
      position={position}
      rotation={rotation}
      mass={mass}
      isStatic={isStatic}
      restitution={restitution}
      friction={friction}
      colliderType={colliderType}
      colliderArgs={[args[0]]}
    >
      <mesh castShadow={castShadow} receiveShadow={receiveShadow}>
        <sphereGeometry args={args} />
        <meshStandardMaterial color={color} />
      </mesh>
      {children}
    </PhysicsWrapper>
  );
}

// ---- GameCylinder ----
interface GameCylinderProps extends PhysicsProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  args?: [number, number, number, number?]; // radiusTop, radiusBottom, height, radialSegments
  color?: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
  children?: ReactNode;
}

export function GameCylinder({
  position,
  rotation,
  args = [0.5, 0.5, 1],
  color = "#888",
  castShadow = true,
  receiveShadow = true,
  mass,
  isStatic,
  restitution,
  friction,
  colliderType = "cuboid",
  children,
}: GameCylinderProps) {
  const radius = Math.max(args[0], args[1]);
  const height = args[2];
  return (
    <PhysicsWrapper
      position={position}
      rotation={rotation}
      mass={mass}
      isStatic={isStatic}
      restitution={restitution}
      friction={friction}
      colliderType={colliderType}
      colliderArgs={[radius, height / 2, radius]}
    >
      <mesh castShadow={castShadow} receiveShadow={receiveShadow}>
        <cylinderGeometry args={args} />
        <meshStandardMaterial color={color} />
      </mesh>
      {children}
    </PhysicsWrapper>
  );
}

// ---- GameCone ----
interface GameConeProps extends PhysicsProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  args?: [number, number, number?]; // radius, height, radialSegments
  color?: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
  children?: ReactNode;
}

export function GameCone({
  position,
  rotation,
  args = [0.5, 1],
  color = "#888",
  castShadow = true,
  receiveShadow = true,
  mass,
  isStatic,
  restitution,
  friction,
  colliderType = "cuboid",
  children,
}: GameConeProps) {
  const radius = args[0];
  const height = args[1];
  return (
    <PhysicsWrapper
      position={position}
      rotation={rotation}
      mass={mass}
      isStatic={isStatic}
      restitution={restitution}
      friction={friction}
      colliderType={colliderType}
      colliderArgs={[radius, height / 2, radius]}
    >
      <mesh castShadow={castShadow} receiveShadow={receiveShadow}>
        <coneGeometry args={args} />
        <meshStandardMaterial color={color} />
      </mesh>
      {children}
    </PhysicsWrapper>
  );
}
