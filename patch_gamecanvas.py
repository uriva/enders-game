import re

with open('src/components/GameCanvas.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'import GroundPlane from "@/components/game/GroundPlane";',
    'import GroundPlane from "@/components/game/GroundPlane";\nimport { GameContext } from "@/contexts/GameContext";'
)

content = content.replace(
    'isDialogFocused: boolean;\n}',
    'isDialogFocused: boolean;\n  onZoneEnter?: (zoneId: string) => void;\n}'
)

content = content.replace(
    '  isDialogFocused,\n}: GameCanvasProps) {',
    '  isDialogFocused,\n  onZoneEnter,\n}: GameCanvasProps) {'
)

# wrap ThreeRenderer in Context.Provider
physics_block = """          <Physics gravity={[0, -9.81, 0]}>
            <GroundPlane size={500} color="#0b1116" position={[0, -0.02, 0]} />
            {/* LLM-generated scene (should include its own lights, fog, etc.) */}
            <GameContext.Provider value={{ onZoneEnter }}>
              {spec && (
                <ThreeRenderer spec={spec} registry={registry as any} />
              )}
            </GameContext.Provider>
            {/* Player is always present — not part of the spec */}
            <Player
              position={[0, 2, 8]}
              isDialogFocused={isDialogFocused}
            />
          </Physics>"""

content = re.sub(
    r'<Physics gravity=\{[^}]+\}>.*?</Physics>',
    physics_block,
    content,
    flags=re.DOTALL
)

with open('src/components/GameCanvas.tsx', 'w') as f:
    f.write(content)

