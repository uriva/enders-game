import re

with open('src/lib/catalog.ts', 'r') as f:
    content = f.read()

audio_def = """  ProceduralAudio: {
    description: "A background music synthesizer. Include EXACTLY ONE in every scene to set the mood.",
    props: z.object({
      mood: z.enum(["ominous", "ethereal", "tense", "triumphant", "silence"]).optional().describe("The mood of the background music. Default: silence"),
      volume: z.number().optional().describe("Volume from 0.0 to 1.0. Default 0.2"),
    }),
  },
"""

content = content.replace(
    '  GroundPlane: {',
    audio_def + '\n  GroundPlane: {'
)

with open('src/lib/catalog.ts', 'w') as f:
    f.write(content)
