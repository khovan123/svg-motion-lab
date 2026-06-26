const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

console.log("Manifest loaded.");
console.log("Schema:", manifest.schema);

function findLayers(node, targetId, path = []) {
  const currentPath = [...path, { id: node.id, name: node.name, type: node.type }];
  if (node.id === targetId || String(node.stableNodeId || '').includes(targetId)) {
    console.log(`Found node ${targetId} at path:`, currentPath.map(p => `${p.name} (${p.id})`).join(' -> '));
    console.log("Details:", JSON.stringify({
      id: node.id,
      name: node.name,
      type: node.type,
      stableNodeId: node.stableNodeId,
      rotation: node.rotation,
      bounds: node.bounds,
      visible: node.visible,
      opacity: node.opacity
    }, null, 2));
  }
  if (node.layers) {
    node.layers.forEach(layer => findLayers(layer, targetId, currentPath));
  }
}

manifest.states.forEach((state, idx) => {
  console.log(`\n--- State ${idx}: ${state.name} (${state.id}) ---`);
  state.layers.forEach(layer => {
    findLayers(layer, "1:4250");
    findLayers(layer, "1:4405");
  });
});
