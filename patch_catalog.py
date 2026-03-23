import re

with open('src/lib/catalog.ts', 'r') as f:
    content = f.read()

definition = """
  TriggerVolume: {
    description:
      "An invisible sensor box that detects when the player walks into it. Use this to create location-based events, like the player approaching an object, hiding behind something, or exploring a specific area. Place these around interesting parts of your scene. When the player enters it, you will be notified.",
    props: z.object({
      name: z.string().describe("A unique, descriptive name for this zone (e.g. 'near_poison_drink', 'behind_giant')"),
      position: vec3.describe("[x, y, z] position"),
      size: vec3.describe("[width, height, depth] — default [2,2,2]")
    }),
  },
"""

# Insert definition before GroundPlane
content = content.replace("  GroundPlane: {", definition + "\n  GroundPlane: {")

with open('src/lib/catalog.ts', 'w') as f:
    f.write(content)

