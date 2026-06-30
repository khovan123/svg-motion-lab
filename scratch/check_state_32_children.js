const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states.find(s => s.id === '1:4291');
console.log(`Layers in state 1:4291 under mask-group:`);
state.layers.forEach(l => {
  if (l.parentStableNodeId && l.parentStableNodeId.includes('mask-group')) {
    console.log(`  layer = ${l.stableNodeId}, parent = ${l.parentStableNodeId}`);
  }
});
