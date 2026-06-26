const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[2];
console.log(`State 2 layers in manifest:`);
state.layers.forEach((l, idx) => {
  console.log(`  [${idx}] Name: ${l.name}, stableNodeId: ${l.stableNodeId}, Bounds: ${JSON.stringify(l.bounds)}`);
});
