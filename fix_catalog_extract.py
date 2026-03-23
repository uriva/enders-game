import re

with open('src/lib/catalog.ts', 'r') as f:
    content = f.read()

bad_extract = """const {
  Box: _box,
  Sphere: _sphere,
  Cylinder: _cylinder,
  Cone: _cone,
  Torus: _torus,
  TorusKnot: _torusKnot,
  Icosahedron: _icosahedron,
  Dodecahedron: _dodecahedron,
  PerspectiveCamera: _cam,
  OrbitControls: _orbit,
  ...keptDefinitions
} = threeComponentDefinitions;"""

good_extract = """const {
  Box: _box,
  Sphere: _sphere,
  Cylinder: _cylinder,
  Cone: _cone,
  PerspectiveCamera: _cam,
  OrbitControls: _orbit,
  ...keptDefinitions
} = threeComponentDefinitions;

// We also manually delete Torus and TorusKnot if they exist, to avoid conflicts with our Game* versions.
if ('Torus' in keptDefinitions) delete (keptDefinitions as any).Torus;
if ('TorusKnot' in keptDefinitions) delete (keptDefinitions as any).TorusKnot;
if ('Icosahedron' in keptDefinitions) delete (keptDefinitions as any).Icosahedron;
if ('Dodecahedron' in keptDefinitions) delete (keptDefinitions as any).Dodecahedron;
"""

content = content.replace(bad_extract, good_extract)

with open('src/lib/catalog.ts', 'w') as f:
    f.write(content)
