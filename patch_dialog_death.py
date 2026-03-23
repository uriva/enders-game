import re

with open('src/components/DialogBox.tsx', 'r') as f:
    content = f.read()

# Remove the deathCount prop usage in the UI
content = content.replace(
    '{deathCount > 0 && <span>deaths: {deathCount}</span>}',
    ''
)

with open('src/components/DialogBox.tsx', 'w') as f:
    f.write(content)
