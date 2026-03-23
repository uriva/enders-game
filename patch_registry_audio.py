import re

with open('src/lib/registry.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'import TriggerVolume from "@/components/game/TriggerVolume";',
    'import TriggerVolume from "@/components/game/TriggerVolume";\nimport ProceduralAudio from "@/components/game/ProceduralAudio";'
)

content = content.replace(
    '  TriggerVolume: wrap(TriggerVolume),',
    '  TriggerVolume: wrap(TriggerVolume),\n  ProceduralAudio: wrap(ProceduralAudio),'
)

with open('src/lib/registry.tsx', 'w') as f:
    f.write(content)
