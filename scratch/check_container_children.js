const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[0];
console.log(`Layers in state 0 under container[0]:`);
state.layers.forEach(l => {
  if (l.parentStableNodeId && l.parentStableNodeId.includes('container[0]')) {
    console.log(`  layer = ${l.stableNodeId}, parent = ${l.parentStableNodeId}`);
  }
});
