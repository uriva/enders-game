// @ts-nocheck — type mismatch between defineRegistry and custom components
import { defineRegistry } from "@json-render/react";
import { threeComponents } from "@json-render/react-three-fiber";
import { catalog } from "./catalog";
import TriggerVolume from "@/components/game/TriggerVolume";
import ProceduralAudio from "@/components/game/ProceduralAudio";
import GroundPlane from "@/components/game/GroundPlane";
import {
  GameBox,
  GameSphere,
  GameCylinder,
  GameCone,
  GameTorus,
  GameTorusKnot,
  GameIcosahedron,
  GameDodecahedron,
} from "@/components/game/GamePrimitives";

/**
 * Wrapper to match json-render's registry component signature:
 * ({ props, children }) => JSX
 */
const wrap = (Component: any) => ({
  props,
  children,
}: {
  props: any;
  children?: any;
}) => <Component {...props}>{children}</Component>;

/**
 * Custom game components for the registry.
 * These map component type names (from the catalog) to actual React components.
 */
const gameComponents = {
  GameBox: wrap(GameBox),
  GameSphere: wrap(GameSphere),
  GameCylinder: wrap(GameCylinder),
  GameCone: wrap(GameCone),
  GameTorus: wrap(GameTorus),
  GameTorusKnot: wrap(GameTorusKnot),
  GameIcosahedron: wrap(GameIcosahedron),
  GameDodecahedron: wrap(GameDodecahedron),
  TriggerVolume: wrap(TriggerVolume),
  ProceduralAudio: wrap(ProceduralAudio),
  GroundPlane: wrap(GroundPlane),
};

/**
 * Full registry result from defineRegistry — contains { registry, handlers, executeAction }.
 */
const registryResult = defineRegistry(catalog, {
  components: {
    ...threeComponents,
    ...gameComponents,
  },
});

/**
 * Component registry — flat map of type names to React components.
 * This is the inner `.registry` from defineRegistry(), which is what
 * ThreeRenderer expects (it does `registry[element.type]` to look up components).
 */
export const registry = registryResult.registry;

/**
 * Action handlers and executor, exported in case we need them later.
 */
export const { handlers, executeAction } = registryResult;
