const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

[1, 3].forEach(sIdx => {
  const state = manifest.states[sIdx];
  console.log(`\n=================== STATE ${sIdx} (${state.name}) LAYERS ===================`);
  state.layers.forEach(l => {
    if (l.stableNodeId.includes('bar-chart')) {
      console.log(`Layer: ${l.name}`);
      console.log(`  StableNodeId: ${l.stableNodeId}`);
      console.log(`  Type: ${l.type}`);
      console.log(`  Bounds: ${JSON.stringify(l.bounds)}`);
    }
  });
});
