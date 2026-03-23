import re

with open('src/lib/catalog.ts', 'r') as f:
    content = f.read()

complex_definitions = """  GameTorus: {
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
"""

content = content.replace(
    '  TriggerVolume: {',
    complex_definitions + '\n  TriggerVolume: {'
)

# Replace the threeComponentDefinitions cherry-picking to remove the base ones
content = content.replace(
    '  Cone: _cone,\n  PerspectiveCamera: _cam,',
    '  Cone: _cone,\n  Torus: _torus,\n  TorusKnot: _torusKnot,\n  Icosahedron: _icosahedron,\n  Dodecahedron: _dodecahedron,\n  PerspectiveCamera: _cam,'
)

with open('src/lib/catalog.ts', 'w') as f:
    f.write(content)
