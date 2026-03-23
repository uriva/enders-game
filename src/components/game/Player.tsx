"use client";

import { useRef, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

const SPEED = 8.0;
const JUMP_FORCE = 8.0;
const RESPAWN_POSITION: [number, number, number] = [0, 2, 8];

interface PlayerProps {
  position?: [number, number, number];
  isDialogFocused?: boolean;
}

/**
 * First-person player controller using PointerLockControls + Rapier physics.
 * Adapted from json-render game-engine example.
 *
 * - WASD movement
 * - Space to jump
 * - Mouse look via PointerLock
 * - Movement disabled when dialog is focused
 */
export default function Player({
  position = RESPAWN_POSITION,
  isDialogFocused = false,
}: PlayerProps) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const controlsRef = useRef<any>(null);
  const initializedCamera = useRef(false);
  const keysRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });
  const { camera } = useThree();

  // Keyboard listeners
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isDialogFocused) return;
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keysRef.current.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          keysRef.current.backward = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          keysRef.current.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          keysRef.current.right = true;
          break;
        case "Space":
          keysRef.current.jump = true;
          break;
      }
    },
    [isDialogFocused],
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    switch (e.code) {
      case "KeyW":
      case "ArrowUp":
        keysRef.current.forward = false;
        break;
      case "KeyS":
      case "ArrowDown":
        keysRef.current.backward = false;
        break;
      case "KeyA":
      case "ArrowLeft":
        keysRef.current.left = false;
        break;
      case "KeyD":
      case "ArrowRight":
        keysRef.current.right = false;
        break;
      case "Space":
        keysRef.current.jump = false;
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Clear keys when dialog gets focused
  useEffect(() => {
    if (isDialogFocused) {
      keysRef.current = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
      };
      // Unlock pointer when dialog is focused
      if (controlsRef.current?.isLocked) {
        controlsRef.current.unlock();
      }
    }
  }, [isDialogFocused]);

  useFrame(() => {
    const body = bodyRef.current;
    if (!body) return;

    const bodyPosition = body.translation();

    if (
      bodyPosition.y < -10 ||
      Math.abs(bodyPosition.x) > 250 ||
      Math.abs(bodyPosition.z) > 250
    ) {
      body.setTranslation(
        { x: position[0], y: position[1], z: position[2] },
        true,
      );
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      camera.position.set(position[0], position[1] + 0.85, position[2]);
      camera.lookAt(0, 2, 0);
      return;
    }

    // Sync camera to body position
    camera.position.set(bodyPosition.x, bodyPosition.y + 0.85, bodyPosition.z);

    // On first frame, point camera toward the origin (where the scene is)
    if (!initializedCamera.current) {
      initializedCamera.current = true;
      camera.lookAt(0, 2, 0);
    }

    // Don't process movement when dialog is open or pointer not locked
    if (isDialogFocused || !controlsRef.current?.isLocked) return;

    const keys = keysRef.current;

    // Get camera direction for movement
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    // Build movement vector
    const move = new THREE.Vector3();
    if (keys.forward) move.add(forward);
    if (keys.backward) move.sub(forward);
    if (keys.right) move.add(right);
    if (keys.left) move.sub(right);

    if (move.length() > 0) {
      move.normalize().multiplyScalar(SPEED);
    }

    // Get current velocity to preserve Y (gravity)
    const vel = body.linvel();

    // Simple ground check: if Y velocity is near zero, player is on ground
    const isGrounded = Math.abs(vel.y) < 0.5; // more forgiving to allow jumping on uneven objects

    let newVelY = vel.y;
    if (keys.jump && isGrounded) {
      newVelY = JUMP_FORCE;
    }

    body.setLinvel({ x: move.x, y: newVelY, z: move.z }, true);
  });

  return (
    <>
      <RigidBody
        ref={bodyRef}
        position={position}
        enabledRotations={[false, false, false]}
        lockRotations
        mass={1}
        linearDamping={0.5}
        type="dynamic"
        userData={{ isPlayer: true }}
      >
        <CapsuleCollider args={[0.4, 0.25]} />
        {/* Add a subtle personal light so the player is never in total darkness */}
        <pointLight position={[0, 0.5, 0]} intensity={2} distance={15} />
      </RigidBody>
      <PointerLockControls ref={controlsRef} />
    </>
  );
}
