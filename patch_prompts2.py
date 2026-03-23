import re

with open('src/lib/prompts/system.ts', 'r') as f:
    content = f.read()

# Add physical limits & shapes to Scene composition rules
new_rules = """      "The player is 1.5 units tall and can only jump about 1 unit high. If you want the player to climb something or reach higher areas, you MUST provide stairs or ramps. Each step cannot exceed 0.8 units in height.",
      "Use GameBox, GameSphere, GameCylinder, GameCone for simple objects.",
      "Use GameTorus, GameTorusKnot, GameIcosahedron, GameDodecahedron for complex, magical, or alien objects.",
      "Combine primitives inside a Group to build complex structures (like statues, archways, or vehicles). Set isStatic: false for objects the player should be able to push.",
      "Include EXACTLY ONE ProceduralAudio component in every scene to set the mood (moods: ominous, ethereal, tense, triumphant, silence).",
"""

content = content.replace(
    '"Use GameBox, GameSphere, GameCylinder, and GameCone for all solid objects. Set isStatic: true (default) for environmental objects. Set isStatic: false for objects the player should be able to push.",',
    new_rules
)

# Update SPEC RULES section
content = content.replace(
    '- Use GameBox, GameSphere, GameCylinder, GameCone for solid objects.',
    '- Use GameBox, GameSphere, GameCylinder, GameCone, GameTorus, GameTorusKnot, GameIcosahedron, GameDodecahedron for solid objects.\n- If a platform is higher than 1 unit, build stairs to it using multiple GameBox elements.\n- Include one ProceduralAudio for background music.'
)

with open('src/lib/prompts/system.ts', 'w') as f:
    f.write(content)

with open('src/lib/prompts/giants-drink.ts', 'r') as f:
    content = f.read()

content = content.replace(
    'GameSphere for head, GameCylinder/GameBox for body parts',
    'GameSphere/GameDodecahedron for head, GameCylinder/GameBox/GameTorus for body parts'
)
content = content.replace(
    '- Heavy atmosphere — use Fog',
    '- Include a ProceduralAudio set to an ominous or tense mood.\n- Heavy atmosphere — use Fog'
)

with open('src/lib/prompts/giants-drink.ts', 'w') as f:
    f.write(content)

