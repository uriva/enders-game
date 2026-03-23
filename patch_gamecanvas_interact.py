import re

with open('src/components/GameCanvas.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'onZoneEnter?: (zoneId: string) => void;',
    'onZoneEnter?: (zoneId: string) => void;\n  onInteract?: (objectName: string, position: [number, number, number]) => void;'
)

content = content.replace(
    '  onZoneEnter,\n}: GameCanvasProps) {',
    '  onZoneEnter,\n  onInteract,\n}: GameCanvasProps) {'
)

content = content.replace(
    '<GameContext.Provider value={{ onZoneEnter }}>',
    '<GameContext.Provider value={{ onZoneEnter, onInteract }}>'
)

with open('src/components/GameCanvas.tsx', 'w') as f:
    f.write(content)
