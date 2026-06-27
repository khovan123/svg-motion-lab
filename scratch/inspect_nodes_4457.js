const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

function findLayers(node, targetId, path = []) {
  const currentPath = [...path, { id: node.id, name: node.name, type: node.type }];
  if (node.id === targetId || String(node.stableNodeId || '').includes(targetId)) {
    console.log(`Found node ${targetId} at path:`, currentPath.map(p => `${p.name} (${p.id})`).join(' -> '));
    console.log("Details:", JSON.stringify({
      id: node.id,
      name: node.name,
      type: node.type,
      stableNodeId: node.stableNodeId,
      bounds: node.bounds,
      visible: node.visible,
      opacity: node.opacity,
      fills: node.fills,
      strokes: node.strokes,
      cornerRadius: node.cornerRadius,
      strokeWeight: node.strokeWeight
    }, null, 2));
  }
  if (node.layers) {
    node.layers.forEach(layer => findLayers(layer, targetId, currentPath));
  }
}

manifest.states.forEach((state, idx) => {
  console.log(`\n--- State ${idx}: ${state.name} (${state.id}) ---`);
  state.layers.forEach(layer => {
    findLayers(layer, "1:4457");
  });
});
