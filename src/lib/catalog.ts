import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { threeComponentDefinitions } from "@json-render/react-three-fiber/catalog";
import { z } from "zod";

// Reusable Zod schemas
const vec3 = z
  .tuple([z.number(), z.number(), z.number()])
  .nullable()
  .optional();

const physicsProps = {
  mass: z.number().optional().describe("Mass for dynamic bodies (default 1)"),
  isStatic: z
    .boolean()
    .optional()
    .describe("If true (default), body is fixed in place"),
  restitution: z
    .number()
    .optional()
    .describe("Bounciness 0-1 (default 0.2)"),
  friction: z
    .number()
    .optional()
    .describe("Surface friction 0-1 (default 0.5)"),
  colliderType: z
    .string()
    .optional()
    .describe("Physics collider shape: cuboid, ball, capsule, or none"),
};

const basePrimitiveProps = {
  position: vec3.describe("[x, y, z] position"),
  rotation: vec3.describe("[x, y, z] rotation in radians"),
  color: z.string().optional().describe("CSS color string (default #888)"),
  castShadow: z.boolean().optional().describe("Cast shadows (default true)"),
  receiveShadow: z
    .boolean()
    .optional()
    .describe("Receive shadows (default true)"),
  ...physicsProps,
};

/**
 * Cherry-pick non-primitive, non-camera definitions from the built-in catalog.
 * We replace Box/Sphere/Cylinder/Cone with physics-enabled Game* versions
 * and remove PerspectiveCamera/OrbitControls (handled by Player component).
 */
const {
  Box: _box,
  Sphere: _sphere,
  Cylinder: _cylinder,
  Cone: _cone,
  PerspectiveCamera: _cam,
  OrbitControls: _orbit,
  ...keptDefinitions
} = threeComponentDefinitions;

// We also manually delete Torus and TorusKnot if they exist, to avoid conflicts with our Game* versions.
if ('Torus' in keptDefinitions) delete (keptDefinitions as any).Torus;
if ('TorusKnot' in keptDefinitions) delete (keptDefinitions as any).TorusKnot;
if ('Icosahedron' in keptDefinitions) delete (keptDefinitions as any).Icosahedron;
if ('Dodecahedron' in keptDefinitions) delete (keptDefinitions as any).Dodecahedron;


/**
 * Custom game component definitions with Zod schemas for props.
 */
const gameComponentDefinitions = {
  GameBox: {
    description:
      "A physics-enabled box/cube. Use for walls, tables, platforms, buildings, any rectangular solid.",
    props: z.object({
      ...basePrimitiveProps,
      args: z
        .tuple([z.number(), z.number(), z.number()])
        .optional()
        .describe("[width, height, depth] — default [1,1,1]"),
    }),
  },
  GameSphere: {
    description:
      "A physics-enabled sphere. Use for heads, boulders, orbs, goblets, round objects.",
    props: z.object({
      ...basePrimitiveProps,
      args: z
        .array(z.number())
        .optional()
        .describe(
          "[radius, widthSegments?, heightSegments?] — default [0.5]"
        ),
    }),
  },
  GameCylinder: {
    description:
      "A physics-enabled cylinder. Use for pillars, legs, arms, tree trunks, goblets.",
    props: z.object({
      ...basePrimitiveProps,
      args: z
        .array(z.number())
        .optional()
        .describe(
          "[radiusTop, radiusBottom, height, radialSegments?] — default [0.5, 0.5, 1]"
        ),
    }),
  },
  GameCone: {
    description:
      "A physics-enabled cone. Use for roofs, hats, teeth, stalagmites, pointed objects.",
    props: z.object({
      ...basePrimitiveProps,
      args: z
        .array(z.number())
        .optional()
        .describe("[radius, height, radialSegments?] — default [0.5, 1]"),
    }),
  },

  GameTorus: {
    description: "A physics-enabled torus (donut shape). Good for rings, portals, or strange architecture.",
    props: z.object({
      ...basePrimitiveProps,
      args: z.array(z.number()).optional().describe("[radius, tubeThickness] — default [1, 0.4]"),
    }),
  },
  GameTorusKnot: {
    description: "A physics-enabled torus knot (complex twisted ring). Great for magical or abstract objects.",
    props: z.object({
      ...basePrimitiveProps,
      args: z.array(z.number()).optional().describe("[radius, tubeThickness] — default [1, 0.4]"),
    }),
  },
  GameIcosahedron: {
    description: "A physics-enabled icosahedron (20-sided polygon). Good for gems, crystals, or abstract rocks.",
    props: z.object({
      ...basePrimitiveProps,
      args: z.array(z.number()).optional().describe("[radius] — default [1]"),
    }),
  },
  GameDodecahedron: {
    description: "A physics-enabled dodecahedron (12-sided polygon). Good for magical objects or complex boulders.",
    props: z.object({
      ...basePrimitiveProps,
      args: z.array(z.number()).optional().describe("[radius] — default [1]"),
    }),
  },

  TriggerVolume: {
    description:
      "An invisible sensor box that detects when the player walks into it. Use this to create location-based events, like the player approaching an object, hiding behind something, or exploring a specific area. Place these around interesting parts of your scene. When the player enters it, you will be notified.",
    props: z.object({
      name: z.string().describe("A unique, descriptive name for this zone (e.g. 'near_poison_drink', 'behind_giant')"),
      position: vec3.describe("[x, y, z] position"),
      size: vec3.describe("[width, height, depth] — default [2,2,2]")
    }),
  },

  ProceduralAudio: {
    description: "A background music synthesizer. Include EXACTLY ONE in every scene to set the mood.",
    props: z.object({
      mood: z.enum(["ominous", "ethereal", "tense", "triumphant", "silence"]).optional().describe("The mood of the background music. Default: silence"),
      volume: z.number().optional().describe("Volume from 0.0 to 1.0. Default 0.2"),
    }),
  },

  GroundPlane: {
    description:
      "A large, flat physics-enabled ground plane. ALWAYS include exactly one GroundPlane in every scene for the player to walk on.",
    props: z.object({
      size: z.number().optional().describe("Size of the ground plane (default 200)"),
      color: z.string().optional().describe("Ground color (default #2a2a2a)"),
      position: vec3.describe(
        "[x, y, z] position — default [0,0,0], the top surface is at y=0"
      ),
    }),
  },
};

/**
 * Game catalog — combines cherry-picked Three.js definitions with
 * physics-enabled game components. Used to generate the LLM system prompt
 * via catalog.prompt() and for validation.
 */
export const catalog = defineCatalog(schema, {
  components: {
    ...keptDefinitions,
    ...gameComponentDefinitions,
  },
  actions: {},
});
