import { RigidBody, CuboidCollider, IntersectionEnterPayload } from "@react-three/rapier";
import { useGameContext } from "@/contexts/GameContext";
import { useEffect } from "react";

export interface TriggerVolumeProps {
  name: string;
  position?: [number, number, number];
  size?: [number, number, number];
}

export default function TriggerVolume({ name, position = [0, 0, 0], size = [2, 2, 2] }: TriggerVolumeProps) {
  const { onZoneEnter } = useGameContext();

  return (
    <RigidBody 
      type="fixed" 
      position={position}
      // Make it a sensor so it doesn't block movement
      sensor 
      onIntersectionEnter={(payload: IntersectionEnterPayload) => {
        // Check if the intersecting body is the player
        if (payload.rigidBodyObject?.userData?.isPlayer) {
          if (onZoneEnter) {
            onZoneEnter(name);
          }
        }
      }}
    >
      <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />
    </RigidBody>
  );
}
