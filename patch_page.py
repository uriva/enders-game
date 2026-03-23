import re

with open('src/app/page.tsx', 'r') as f:
    content = f.read()

# Add ref for zones
content = content.replace(
    '  const initialized = useRef(false);',
    '  const initialized = useRef(false);\n  const recentZones = useRef<Record<string, number>>({});'
)

# Add onZoneEnter handler
zone_handler = """  const handleZoneEnter = useCallback((zoneId: string) => {
    if (!gameState || loading) return;
    
    const now = Date.now();
    const lastTriggered = recentZones.current[zoneId] || 0;
    
    // Prevent re-triggering the same zone within 30 seconds
    if (now - lastTriggered < 30000) return;
    
    recentZones.current[zoneId] = now;
    console.log("[page] Player entered zone:", zoneId);
    
    const systemAction = `*[System: Player walked into zone '${zoneId}']*`;
    handleAction(systemAction);
  }, [gameState, loading, handleAction]);
"""

# Insert handler before startGame
content = content.replace('  const startGame = useCallback(', zone_handler + '\n  const startGame = useCallback(')

# Pass handler to GameCanvas
content = content.replace(
    '        isDialogFocused={isDialogFocused}',
    '        isDialogFocused={isDialogFocused}\n        onZoneEnter={handleZoneEnter}'
)

with open('src/app/page.tsx', 'w') as f:
    f.write(content)

