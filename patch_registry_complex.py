import re

with open('src/lib/registry.tsx', 'r') as f:
    content = f.read()

imports = """  GameBox,
  GameSphere,
  GameCylinder,
  GameCone,
  GameTorus,
  GameTorusKnot,
  GameIcosahedron,
  GameDodecahedron,"""

content = content.replace(
    '  GameBox,\n  GameSphere,\n  GameCylinder,\n  GameCone,\n',
    imports + '\n'
)

registrations = """  GameBox: wrap(GameBox),
  GameSphere: wrap(GameSphere),
  GameCylinder: wrap(GameCylinder),
  GameCone: wrap(GameCone),
  GameTorus: wrap(GameTorus),
  GameTorusKnot: wrap(GameTorusKnot),
  GameIcosahedron: wrap(GameIcosahedron),
  GameDodecahedron: wrap(GameDodecahedron),"""

content = content.replace(
    '  GameBox: wrap(GameBox),\n  GameSphere: wrap(GameSphere),\n  GameCylinder: wrap(GameCylinder),\n  GameCone: wrap(GameCone),',
    registrations
)

with open('src/lib/registry.tsx', 'w') as f:
    f.write(content)
