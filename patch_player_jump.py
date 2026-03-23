import re

with open('src/components/game/Player.tsx', 'r') as f:
    content = f.read()

# Make player faster and jump higher
content = content.replace('const SPEED = 6.5;', 'const SPEED = 8.0;')
content = content.replace('const JUMP_FORCE = 6.5;', 'const JUMP_FORCE = 8.0;')

# Adjust the simple ground check to be even more forgiving for physics colliders
content = content.replace(
    'const isGrounded = Math.abs(vel.y) < 0.2;',
    'const isGrounded = Math.abs(vel.y) < 0.5; // more forgiving to allow jumping on uneven objects'
)

# Also make the player a bit smaller so they don't get stuck on edges easily
# previous: <CapsuleCollider args={[0.35, 0.3]} /> (halfHeight, radius)
content = content.replace(
    '<CapsuleCollider args={[0.35, 0.3]} />',
    '<CapsuleCollider args={[0.4, 0.25]} />'
)

with open('src/components/game/Player.tsx', 'w') as f:
    f.write(content)
