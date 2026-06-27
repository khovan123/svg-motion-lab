const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

function findNodes(node, stateIdx) {
  const name = String(node.name || '');
  if (name.toLowerCase().includes('refresh') || name.toLowerCase().includes('hugeicons') || name.toLowerCase().includes('spinner')) {
    console.log(`State ${stateIdx}: id=${node.id}, name="${node.name}", stableNodeId="${node.stableNodeId}", bounds=`, node.bounds, `visible=${node.visible}, opacity=${node.opacity}`);
  }
  if (node.layers) {
    node.layers.forEach(layer => findNodes(layer, stateIdx));
  }
}

manifest.states.forEach((state, idx) => {
  console.log(`\n--- State ${idx}: ${state.name} (${state.id}) ---`);
  state.layers.forEach(layer => findNodes(layer, idx));
});
