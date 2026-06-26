const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state = manifest.states[3]; // Property 1=4

console.log(`State: ${state.name}`);
state.layers.forEach(layer => {
  console.log(`  Layer: name="${layer.name}", type=${layer.type}, id=${layer.id}, stableNodeId=${layer.stableNodeId}`);
  console.log(`    bounds: ${JSON.stringify(layer.bounds)}`);
});
