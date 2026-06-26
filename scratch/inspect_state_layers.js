const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state = manifest.states[0];

console.log(`State Name: ${state.name}`);
console.log('Total layers:', state.layers.length);

state.layers.forEach((layer, idx) => {
  console.log(`Layer ${idx}: type=${layer.type}, name="${layer.name}", id=${layer.id}, stableNodeId=${layer.stableNodeId}, parent=${layer.parentStableNodeId}`);
});
