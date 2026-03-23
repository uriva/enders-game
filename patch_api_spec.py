import re

with open('src/app/api/act/route.ts', 'r') as f:
    content = f.read()

# Update POST request to receive currentSpec
content = content.replace(
    'const { gameState, action } = body as {',
    'const { gameState, action, currentSpec } = body as {'
)
content = content.replace(
    '      action: string | null;\n    };',
    '      action: string | null;\n      currentSpec?: any;\n    };'
)

# Update prompt builders to accept currentSpec
content = content.replace(
    'userPrompt = buildGiantsDrinkPrompt(gameState);',
    'userPrompt = buildGiantsDrinkPrompt(gameState, currentSpec);'
)
content = content.replace(
    'userPrompt = buildGiantsDrinkActionPrompt(gameState, action);',
    'userPrompt = buildGiantsDrinkActionPrompt(gameState, action, currentSpec);'
)
content = content.replace(
    'userPrompt = buildBeyondPrompt(gameState, action);',
    'userPrompt = buildBeyondPrompt(gameState, action, currentSpec);'
)

with open('src/app/api/act/route.ts', 'w') as f:
    f.write(content)
