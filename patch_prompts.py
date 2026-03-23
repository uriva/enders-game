import re

with open('src/lib/prompts/system.ts', 'r') as f:
    content = f.read()

content = content.replace(
    '"EVERY scene MUST include exactly one GroundPlane element for the player to walk on.",',
    '"DO NOT include a GroundPlane. A huge physics-enabled dark ground plane at y=-0.02 is already hardcoded into the runtime. DO NOT duplicate it.",\n      "DO NOT include cameras, OrbitControls, or player controllers. The player is hardcoded at [0, 2, 8] with a headlamp.",\n      "DO NOT include basic fallback lighting (ambient and point lights are already hardcoded, though you should add your own dramatic lighting on top).",\n      "USE TriggerVolume to create reactive scenes! Place TriggerVolumes around interesting objects (like behind the Giant, near the drinks). When the player walks into a TriggerVolume, you will receive a system message and can react dynamically!",'
)

# Also update response format rules
content = content.replace(
    '- ALWAYS include a GroundPlane.',
    '- DO NOT include a GroundPlane. It is hardcoded in the engine.'
)
content = content.replace(
    '"ground": { "type": "GroundPlane", "props": { "color": "#1a1a1a", "size": 200 }, "children": [] },\n',
    ''
)
content = content.replace(
    '"children": ["ground", "ambient", "sun", "fog", "giant-group"]',
    '"children": ["ambient", "sun", "fog", "giant-group"]'
)

with open('src/lib/prompts/system.ts', 'w') as f:
    f.write(content)


with open('src/lib/prompts/giants-drink.ts', 'r') as f:
    content = f.read()

content = content.replace(
    '- ALWAYS include a GroundPlane for the player to walk on',
    '- DO NOT include a GroundPlane. The engine already provides an infinite GroundPlane at y=0.\\n- Place 1-3 TriggerVolume elements near points of interest (e.g., near the left drink, near the right drink, behind the giant) to detect player movement.'
)
content = content.replace('- KEEP the GroundPlane — the player still needs to walk', '')
content = content.replace('- KEEP the GroundPlane', '')
content = content.replace('The GroundPlane and overall layout should persist.', 'The overall layout should persist.')
content = content.replace(
    '// Other non-creative action\n  return `The player did: "${action}"',
    '// Other non-creative action\n  const isSystemZone = action.startsWith("*[System: Player walked into zone");\n  if (isSystemZone) {\n    return `The player physically moved in the 3D space: "${action}"\\n\\nThe Giant notices this movement. React to their physical position! The scene spec should stay mostly the same, but the Giant should say something acknowledging where they walked. Don\\'t kill them just for exploring.\\n\\nSet sceneTransition to "none".\\n\\nPrevious scene seed: "${state.seed}"`;\n  }\n\n  return `The player did: "${action}"'
)

with open('src/lib/prompts/giants-drink.ts', 'w') as f:
    f.write(content)
