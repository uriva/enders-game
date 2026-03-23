import re

with open('src/components/GameCanvas.tsx', 'r') as f:
    content = f.read()

# Make helper text a bit larger and clearer
content = content.replace(
    'className="absolute top-4 left-4 text-gray-600 font-mono text-[10px] pointer-events-none"',
    'className="absolute top-4 left-4 text-gray-400 font-mono text-xs bg-black/50 p-2 rounded pointer-events-none"'
)

with open('src/components/GameCanvas.tsx', 'w') as f:
    f.write(content)
