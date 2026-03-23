import re

with open('src/app/page.tsx', 'r') as f:
    content = f.read()

# Add isDead state
content = content.replace(
    'const [isDialogFocused, setIsDialogFocused] = useState(false);',
    'const [isDialogFocused, setIsDialogFocused] = useState(false);\n  const [isDead, setIsDead] = useState(false);'
)

# Handle death transition
death_handler_old = """      // If the player died, show death scene briefly, then re-generate Giant's Drink
      if (response.sceneTransition === "death") {
        const afterDeath = applyResponse(current, response);
        setGameState(afterDeath);

        // After a pause, regenerate the Giant's Drink scene
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const respawn = await fetchScene(afterDeath, null);
        if (respawn) {
          const afterRespawn = applyResponse(afterDeath, respawn);
          setGameState(afterRespawn);
        }
      }"""

death_handler_new = """      // If the player died, show death scene briefly, then re-generate Giant's Drink
      if (response.sceneTransition === "death") {
        const afterDeath = applyResponse(current, response);
        setGameState(afterDeath);

        // After a pause, regenerate the Giant's Drink scene
        await new Promise((resolve) => setTimeout(resolve, 3000));
        
        setIsDead(true);
        setDialog("");
        
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const respawn = await fetchScene(afterDeath, null);
        if (respawn) {
          const afterRespawn = applyResponse(afterDeath, respawn);
          setGameState(afterRespawn);
        }
        setIsDead(false);
      }"""

content = content.replace(death_handler_old, death_handler_new)

# Add death screen to render
return_old = """  return (
    <div className="relative h-screen w-screen bg-black">
      <GameCanvas"""

return_new = """  return (
    <div className="relative h-screen w-screen bg-black">
      {isDead && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md transition-opacity duration-1000">
          <div className="text-center space-y-4">
            <h1 className="text-red-600 font-serif text-6xl tracking-widest uppercase">You Died</h1>
            <p className="text-gray-500 font-mono text-sm tracking-widest">The Mind Game resets...</p>
          </div>
        </div>
      )}
      <GameCanvas"""

content = content.replace(return_old, return_new)

with open('src/app/page.tsx', 'w') as f:
    f.write(content)
