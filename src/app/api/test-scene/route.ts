/**
 * Debug endpoint: returns a hardcoded scene via NDJSON
 * to test the rendering pipeline without waiting for Gemini.
 * 
 * GET /api/test-scene
 */

const TEST_SCENE = {
  dialog: "A dark figure looms before you. Two goblets gleam on a stone table. 'Choose,' the Giant rumbles.",
  spec: {
    root: "scene",
    elements: {
      scene: {
        type: "Group",
        props: {},
        children: ["ground", "ambient", "dir-light", "point-light", "giant-body", "giant-head", "giant-eye-l", "giant-eye-r", "table", "goblet-1", "goblet-2"],
      },
      ground: {
        type: "GroundPlane",
        props: { size: 200, color: "#1a2a1a", position: [0, 0, 0] },
      },
      ambient: {
        type: "AmbientLight",
        props: { intensity: 0.4, color: "#ccccff" },
      },
      "dir-light": {
        type: "DirectionalLight",
        props: { position: [5, 15, 10], intensity: 1.5, color: "#aabbff", castShadow: true },
      },
      "point-light": {
        type: "PointLight",
        props: { position: [0, 6, 4], intensity: 2, color: "#ff8844", distance: 20 },
      },
      "giant-body": {
        type: "GameBox",
        props: { position: [0, 4, 0], args: [4, 8, 3], color: "#4a3a4a", isStatic: true },
      },
      "giant-head": {
        type: "GameSphere",
        props: { position: [0, 10, 0], args: [2], color: "#5a4a5a", isStatic: true },
      },
      "giant-eye-l": {
        type: "GameSphere",
        props: { position: [-0.6, 10.3, 1.8], args: [0.3], color: "#ff4444", isStatic: true },
      },
      "giant-eye-r": {
        type: "GameSphere",
        props: { position: [0.6, 10.3, 1.8], args: [0.3], color: "#ff4444", isStatic: true },
      },
      table: {
        type: "GameBox",
        props: { position: [0, 1, 4], args: [3, 0.2, 1.5], color: "#6a4a2a", isStatic: true },
      },
      "goblet-1": {
        type: "GameCylinder",
        props: { position: [-0.5, 1.5, 4], args: [0.15, 0.1, 0.5, 12], color: "#44aaff", isStatic: true },
      },
      "goblet-2": {
        type: "GameCylinder",
        props: { position: [0.5, 1.5, 4], args: [0.15, 0.1, 0.5, 12], color: "#ff44aa", isStatic: true },
      },
    },
  },
  psychUpdate: {},
  sceneTransition: "none",
};

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send dialog
      controller.enqueue(
        encoder.encode(
          JSON.stringify({ type: "dialog", text: TEST_SCENE.dialog }) + "\n"
        )
      );

      // Send result after a small delay to simulate streaming
      setTimeout(() => {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type: "result", data: TEST_SCENE }) + "\n"
          )
        );
        controller.close();
      }, 500);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  });
}
