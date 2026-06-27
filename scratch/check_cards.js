const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

console.log("Analyzing layers containing 'card' or 'Card' in State 0:");
const state = manifest.states[0];
const cardLayers = state.layers.filter(l => l.name.toLowerCase().includes('card'));

cardLayers.forEach(l => {
  console.log(`Layer: ID=${l.id}, Name="${l.name}", stableNodeId="${l.stableNodeId}", parent="${l.parentStableNodeId}"`);
});

console.log("\nTotal layers in State 0:", state.layers.length);
console.log("All layers in State 0:");
state.layers.forEach((l, idx) => {
  console.log(`[${idx}] Name="${l.name}", stableNodeId="${l.stableNodeId}", parent="${l.parentStableNodeId}"`);
});
