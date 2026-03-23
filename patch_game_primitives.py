import re

with open('src/components/game/GamePrimitives.tsx', 'r') as f:
    content = f.read()

# Update PhysicsProps
content = content.replace(
    'colliderType?: "cuboid" | "ball" | "capsule" | "none";',
    'colliderType?: "cuboid" | "ball" | "capsule" | "hull" | "trimesh" | "none";'
)

# Update PhysicsWrapper
wrapper_old = """function PhysicsWrapper({
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
}"""

wrapper_new = """function PhysicsWrapper({
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

  if (colliderType === "hull" || colliderType === "trimesh") {
    return (
      <RigidBody
        type={isStatic ? "fixed" : "dynamic"}
        position={position}
        rotation={rotation}
        mass={mass}
        restitution={restitution}
        friction={friction}
        colliders={colliderType}
      >
        {children}
      </RigidBody>
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
      colliders={false}
    >
      {collider}
      {children}
    </RigidBody>
  );
}"""

content = content.replace(wrapper_old, wrapper_new)

# Add new primitives
new_primitives = """
// ---- Complex Shapes ----

interface GameTorusProps extends PhysicsProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  args?: [number, number, number?, number?]; // radius, tube, radialSegments, tubularSegments
  color?: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
  children?: ReactNode;
}

export function GameTorus({
  position,
  rotation,
  args = [1, 0.4, 16, 100],
  color = "#888",
  castShadow = true,
  receiveShadow = true,
  mass,
  isStatic,
  restitution,
  friction,
  colliderType = "trimesh",
  children,
}: GameTorusProps) {
  return (
    <PhysicsWrapper
      position={position}
      rotation={rotation}
      mass={mass}
      isStatic={isStatic}
      restitution={restitution}
      friction={friction}
      colliderType={colliderType}
    >
      <mesh castShadow={castShadow} receiveShadow={receiveShadow}>
        <torusGeometry args={args} />
        <meshStandardMaterial color={color} />
      </mesh>
      {children}
    </PhysicsWrapper>
  );
}

interface GameTorusKnotProps extends PhysicsProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  args?: [number, number, number?, number?, number?, number?];
  color?: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
  children?: ReactNode;
}

export function GameTorusKnot({
  position,
  rotation,
  args = [1, 0.4, 64, 8, 2, 3],
  color = "#888",
  castShadow = true,
  receiveShadow = true,
  mass,
  isStatic,
  restitution,
  friction,
  colliderType = "trimesh",
  children,
}: GameTorusKnotProps) {
  return (
    <PhysicsWrapper
      position={position}
      rotation={rotation}
      mass={mass}
      isStatic={isStatic}
      restitution={restitution}
      friction={friction}
      colliderType={colliderType}
    >
      <mesh castShadow={castShadow} receiveShadow={receiveShadow}>
        <torusKnotGeometry args={args} />
        <meshStandardMaterial color={color} />
      </mesh>
      {children}
    </PhysicsWrapper>
  );
}

interface GamePolyhedronProps extends PhysicsProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  args?: [number, number?]; // radius, detail
  color?: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
  children?: ReactNode;
}

export function GameIcosahedron({
  position,
  rotation,
  args = [1, 0],
  color = "#888",
  castShadow = true,
  receiveShadow = true,
  mass,
  isStatic,
  restitution,
  friction,
  colliderType = "hull",
  children,
}: GamePolyhedronProps) {
  return (
    <PhysicsWrapper
      position={position}
      rotation={rotation}
      mass={mass}
      isStatic={isStatic}
      restitution={restitution}
      friction={friction}
      colliderType={colliderType}
    >
      <mesh castShadow={castShadow} receiveShadow={receiveShadow}>
        <icosahedronGeometry args={args} />
        <meshStandardMaterial color={color} />
      </mesh>
      {children}
    </PhysicsWrapper>
  );
}

export function GameDodecahedron({
  position,
  rotation,
  args = [1, 0],
  color = "#888",
  castShadow = true,
  receiveShadow = true,
  mass,
  isStatic,
  restitution,
  friction,
  colliderType = "hull",
  children,
}: GamePolyhedronProps) {
  return (
    <PhysicsWrapper
      position={position}
      rotation={rotation}
      mass={mass}
      isStatic={isStatic}
      restitution={restitution}
      friction={friction}
      colliderType={colliderType}
    >
      <mesh castShadow={castShadow} receiveShadow={receiveShadow}>
        <dodecahedronGeometry args={args} />
        <meshStandardMaterial color={color} />
      </mesh>
      {children}
    </PhysicsWrapper>
  );
}
"""

content += new_primitives

with open('src/components/game/GamePrimitives.tsx', 'w') as f:
    f.write(content)

