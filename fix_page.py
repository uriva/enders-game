import re

with open('src/app/page.tsx', 'r') as f:
    content = f.read()

# Extract handleZoneEnter
handler_match = re.search(r'  const handleZoneEnter = useCallback\(\(zoneId: string\) => \{.*?\n  \}, \[gameState, loading, handleAction\]\);\n\n', content, re.DOTALL)
if handler_match:
    handler = handler_match.group(0)
    # Remove from current position
    content = content.replace(handler, '')
    
    # Insert after handleAction
    handle_action_end = content.find('  const handleAction = useCallback(')
    if handle_action_end != -1:
        end_brace = content.find('  );', handle_action_end) + 4
        # insert after
        content = content[:end_brace] + '\n\n' + handler + content[end_brace:]
        
with open('src/app/page.tsx', 'w') as f:
    f.write(content)

