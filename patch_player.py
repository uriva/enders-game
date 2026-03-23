import re

with open('src/components/game/Player.tsx', 'r') as f:
    content = f.read()

# Make player faster and jump higher
content = content.replace('const SPEED = 5;', 'const SPEED = 6.5;')
content = content.replace('const JUMP_FORCE = 5;', 'const JUMP_FORCE = 6.5;')

# Make ground check slightly more forgiving
content = content.replace(
    'const isGrounded = Math.abs(vel.y) < 0.1;',
    'const isGrounded = Math.abs(vel.y) < 0.2;'
)

with open('src/components/game/Player.tsx', 'w') as f:
    f.write(content)
