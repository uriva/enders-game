import re

with open('src/lib/registry.tsx', 'r') as f:
    content = f.read()

import_statement = "import TriggerVolume from \"@/components/game/TriggerVolume\";"
content = content.replace("import GroundPlane from", import_statement + "\nimport GroundPlane from")

add_to_game_components = "  TriggerVolume: wrap(TriggerVolume),"
content = content.replace("  GroundPlane: wrap(GroundPlane),", add_to_game_components + "\n  GroundPlane: wrap(GroundPlane),")

with open('src/lib/registry.tsx', 'w') as f:
    f.write(content)

