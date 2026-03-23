"use client";

import { useRef, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useGameContext } from "@/contexts/GameContext";

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
    interact: false,
  });
  const { camera, scene } = useThree();
  const { onInteract } = useGameContext();
  const raycaster = new THREE.Raycaster();
  const lastInteractTime = useRef(0);
  const handRef = useRef<THREE.Group>(null);
  const handAnimationRef = useRef({ time: 0, active: false });


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
        case "KeyE":
          keysRef.current.interact = true;
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
        interact: false,
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

    // Hand animation
    if (handRef.current) {
      // Bob the hand slightly while walking
      const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
      const bobTarget = isGrounded && speed > 0.1 ? Math.sin(performance.now() / 150) * 0.05 : 0;
      // We start at y = -0.25 so it's visible on screen
      handRef.current.position.y += ((-0.25 + bobTarget) - handRef.current.position.y) * 0.1;
      
      // Interaction animation (poke forward)
      if (handAnimationRef.current.active) {
        handAnimationRef.current.time += 0.1;
        const poke = Math.sin(handAnimationRef.current.time * Math.PI) * 0.3; // poke forward
        handRef.current.position.z = -0.5 - poke;
        
        if (handAnimationRef.current.time >= 1) {
          handAnimationRef.current.active = false;
          handRef.current.position.z = -0.5;
        }
      }
    }

    // Interaction check
    if (keys.interact) {
      keys.interact = false; // consume the key press
      
      const now = performance.now();
      if (now - lastInteractTime.current > 1000) { // 1 sec cooldown
        lastInteractTime.current = now;
        
        // Trigger hand animation
        handAnimationRef.current = { time: 0, active: true };
        
        // Raycast
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera); // center of screen
        
        // We want to intersect meshes, but typically the meshes are children of the RigidBody groups.
        // It's tricky with rapier, but raycasting against the scene works for standard Three.js objects.
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        let hitSomething = false;
        
        for (let i = 0; i < intersects.length; i++) {
          const hit = intersects[i];
          if (hit.distance > 4) break; // too far
          
          // Skip the ground plane, sky, player, etc.
          const obj = hit.object;
          if (obj.userData?.isPlayer) continue;
          
          // Try to guess a name
          let name = obj.name || obj.parent?.name || (obj as THREE.Mesh).geometry?.type?.replace('Geometry', '') || "object";
          if (name === "Box") name = "block";
          if (name === "Sphere") name = "orb";
          if (name === "Cylinder") name = "pillar";
          
          // If we hit a standard mesh (not an invisible collider)
          if (obj instanceof THREE.Mesh && !obj.name.includes('ground') && !name.includes('Plane')) {
            hitSomething = true;
            if (onInteract) {
              onInteract(name.toLowerCase(), [hit.point.x, hit.point.y, hit.point.z]);
            }
            break;
          }
        }
        
        if (!hitSomething && onInteract) {
          // If they try to interact with thin air
          // We could send nothing, or we could let the AI know they are grasping at nothing
        }
      }
    }

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
      {/* Attach a visual hand to the camera */}
      <group>
        <primitive object={camera}>
          {/* Base rotation points fingers roughly forward, palm slightly inward and up */}
          <group ref={handRef} position={[0.3, -0.25, -0.5]} rotation={[-Math.PI / 4, -0.2, 0.1]}>
            {/* Palm */}
            <mesh castShadow position={[0, 0, 0]}>
              <boxGeometry args={[0.08, 0.1, 0.03]} />
              <meshStandardMaterial color="#f0d0b0" roughness={0.6} />
            </mesh>
            {/* Thumb (on the left side since it's a right hand) */}
            <mesh castShadow position={[-0.05, 0, 0.01]} rotation={[0, 0.2, 0.4]}>
              <capsuleGeometry args={[0.012, 0.04, 4, 8]} />
              <meshStandardMaterial color="#f0d0b0" roughness={0.6} />
            </mesh>
            {/* Index Finger */}
            <mesh castShadow position={[-0.025, 0.07, 0]}>
              <capsuleGeometry args={[0.012, 0.05, 4, 8]} />
              <meshStandardMaterial color="#f0d0b0" roughness={0.6} />
            </mesh>
            {/* Middle Finger */}
            <mesh castShadow position={[0, 0.075, 0]}>
              <capsuleGeometry args={[0.012, 0.06, 4, 8]} />
              <meshStandardMaterial color="#f0d0b0" roughness={0.6} />
            </mesh>
            {/* Ring Finger */}
            <mesh castShadow position={[0.025, 0.07, 0]}>
              <capsuleGeometry args={[0.012, 0.05, 4, 8]} />
              <meshStandardMaterial color="#f0d0b0" roughness={0.6} />
            </mesh>
            {/* Pinky Finger */}
            <mesh castShadow position={[0.045, 0.06, 0]}>
              <capsuleGeometry args={[0.01, 0.04, 4, 8]} />
              <meshStandardMaterial color="#f0d0b0" roughness={0.6} />
            </mesh>
          </group>
        </primitive>
      </group>
      <PointerLockControls ref={controlsRef} />
    </>
  );
}
