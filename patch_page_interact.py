import re

with open('src/app/page.tsx', 'r') as f:
    content = f.read()

interact_handler = """  const handleInteract = useCallback((objectName: string, position: [number, number, number]) => {
    if (!gameState || loading) return;
    
    console.log(`[page] Player interacted with ${objectName} at`, position);
    
    const systemAction = `*[System: Player pressed 'E' to interact with an object visually similar to '${objectName}' at position [${position[0].toFixed(1)}, ${position[1].toFixed(1)}, ${position[2].toFixed(1)}]]*`;
    handleAction(systemAction);
  }, [gameState, loading, handleAction]);
"""

content = content.replace(
    '  const handleZoneEnter = useCallback(',
    interact_handler + '\n  const handleZoneEnter = useCallback('
)

content = content.replace(
    'onZoneEnter={handleZoneEnter}',
    'onZoneEnter={handleZoneEnter}\n        onInteract={handleInteract}'
)

with open('src/app/page.tsx', 'w') as f:
    f.write(content)

