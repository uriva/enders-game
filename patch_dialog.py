import re

with open('src/components/DialogBox.tsx', 'r') as f:
    content = f.read()

# Increase text size of dialog
content = content.replace(
    'className="text-gray-200 font-serif text-sm leading-relaxed italic"',
    'className="text-gray-200 font-serif text-lg leading-relaxed italic"'
)

# Increase text size of input
content = content.replace(
    'text-gray-200 font-mono text-sm placeholder-gray-600',
    'text-gray-200 font-mono text-base placeholder-gray-600'
)

# Increase max height to accommodate larger text
content = content.replace(
    'max-h-32',
    'max-h-48'
)

with open('src/components/DialogBox.tsx', 'w') as f:
    f.write(content)

