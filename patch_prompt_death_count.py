import re

with open('src/lib/prompts/giants-drink.ts', 'r') as f:
    content = f.read()

old_death_context = """  const deathContext =
    deathCount > 0
      ? `\\n\\nThe player has died ${deathCount} time(s) and returned to the Giant. Each death should subtly change the scene — the Giant's expression, the room's mood, the goblets' appearance, ambient details. The Giant may reference their return with dark amusement. The scene should feel increasingly wrong/unsettling with each death.`
      : "";"""

new_death_context = """  const deathContext =
    deathCount > 0
      ? `\\n\\nThe player has died ${deathCount} time(s) and returned to the Giant. Each death should subtly change the scene — the Giant's expression, the room's mood, the goblets' appearance, ambient details. The Giant may reference their return with dark amusement. The scene should feel increasingly wrong/unsettling with each death.\\n\\nCRITICAL: The UI no longer shows the death count. You MUST weave the death count (currently ${deathCount}) into the scene yourself. You can do this by:\\n1. Having the Giant mention it in the dialog.\\n2. Using an HtmlLabel component to render floating 3D text in the scene (e.g. carving it on a stone, or a glowing counter).`
      : "";"""

content = content.replace(old_death_context, new_death_context)

with open('src/lib/prompts/giants-drink.ts', 'w') as f:
    f.write(content)

with open('src/lib/prompts/system.ts', 'r') as f:
    content = f.read()

# Make sure HtmlLabel is mentioned as allowed if they want to put text in the world
old_primitives = '"Use GameBox, GameSphere, GameCylinder, GameCone for simple objects.",'
new_primitives = '"Use GameBox, GameSphere, GameCylinder, GameCone for simple objects.",\n      "Use HtmlLabel to put floating text in the 3D world (e.g., for signs, counters, or eerie messages).",'

content = content.replace(old_primitives, new_primitives)

with open('src/lib/prompts/system.ts', 'w') as f:
    f.write(content)
