const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[0];
console.log(`State 0 (${state.name}) layers:`);
state.layers.forEach(l => {
  if (l.stableNodeId.includes('bar-chart')) {
    console.log(`Layer: ${l.name}`);
    console.log(`  StableNodeId: ${l.stableNodeId}`);
    console.log(`  Type: ${l.type}`);
    console.log(`  Bounds: ${JSON.stringify(l.bounds)}`);
  }
});
