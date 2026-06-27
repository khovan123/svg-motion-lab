const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

function searchNode(node, targetId, path = []) {
  const currentPath = [...path, { id: node.id, name: node.name, type: node.type }];
  if (node.id === targetId || String(node.stableNodeId || '').includes(targetId)) {
    console.log(`Found node ${targetId} at path:`, currentPath.map(p => `${p.name} (${p.id})`).join(' -> '));
  }
  if (node.layers) {
    node.layers.forEach(layer => searchNode(layer, targetId, currentPath));
  }
}

manifest.states.forEach((state, idx) => {
  state.layers.forEach(layer => searchNode(layer, "15:924"));
});
