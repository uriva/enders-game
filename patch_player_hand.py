import re

with open('src/components/game/Player.tsx', 'r') as f:
    content = f.read()

# Add useGameContext import
content = content.replace(
    'import * as THREE from "three";',
    'import * as THREE from "three";\nimport { useGameContext } from "@/contexts/GameContext";'
)

# Add interact key to keysRef
content = content.replace(
    'jump: false,\n  });',
    'jump: false,\n    interact: false,\n  });'
)

# Handle E key
content = content.replace(
    '        case "Space":\n          keysRef.current.jump = true;\n          break;',
    '        case "Space":\n          keysRef.current.jump = true;\n          break;\n        case "KeyE":\n          keysRef.current.interact = true;\n          break;'
)
content = content.replace(
    '        case "Space":\n        keysRef.current.jump = false;\n        break;',
    '        case "Space":\n        keysRef.current.jump = false;\n        break;\n      case "KeyE":\n        keysRef.current.interact = false;\n        break;'
)

# Add context and refs
useframe_start = """  const { camera, scene } = useThree();
  const { onInteract } = useGameContext();
  const raycaster = new THREE.Raycaster();
  const lastInteractTime = useRef(0);
  const handRef = useRef<THREE.Group>(null);
  const handAnimationRef = useRef({ time: 0, active: false });
"""

content = content.replace('  const { camera } = useThree();', useframe_start)

# Add interaction logic in useFrame
useframe_body = """
    // Hand animation
    if (handRef.current) {
      // Bob the hand slightly while walking
      const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
      const bobTarget = isGrounded && speed > 0.1 ? Math.sin(performance.now() / 150) * 0.05 : 0;
      handRef.current.position.y += (bobTarget - handRef.current.position.y) * 0.1;
      
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
          let name = obj.name || obj.parent?.name || obj.geometry?.type.replace('Geometry', '') || "object";
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
"""

content = content.replace(
    '    body.setLinvel({ x: move.x, y: newVelY, z: move.z }, true);\n  });',
    '    body.setLinvel({ x: move.x, y: newVelY, z: move.z }, true);\n' + useframe_body + '\n  });'
)

# Add hand to return
hand_jsx = """      {/* Attach a visual hand to the camera */}
      <group>
        <primitive object={camera}>
          <group ref={handRef} position={[0.4, -0.3, -0.5]} rotation={[0, -0.2, 0]}>
            <mesh castShadow>
              <capsuleGeometry args={[0.06, 0.2, 4, 8]} />
              <meshStandardMaterial color="#f0d0b0" roughness={0.6} />
            </mesh>
          </group>
        </primitive>
      </group>"""

content = content.replace(
    '      <PointerLockControls ref={controlsRef} />',
    hand_jsx + '\n      <PointerLockControls ref={controlsRef} />'
)

with open('src/components/game/Player.tsx', 'w') as f:
    f.write(content)
