const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[0];
console.log(`State 0 layers parent-child relationships:`);
state.layers.forEach(l => {
  console.log(`Layer: ${l.name}`);
  console.log(`  id: ${l.stableNodeId}`);
  console.log(`  parent: ${l.parentStableNodeId}`);
});
