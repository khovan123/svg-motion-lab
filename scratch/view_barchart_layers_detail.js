const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

[0, 2].forEach(sIdx => {
  const state = manifest.states[sIdx];
  console.log(`\n================ STATE ${sIdx} (${state.name}) ================`);
  const layers = state.layers || [];
  const barChartLayers = layers.filter(l => l.stableNodeId.includes('bar-chart'));
  barChartLayers.forEach(l => {
    console.log(`Layer: ${l.stableNodeId}`);
    console.log(`  Name: ${l.name}`);
    console.log(`  Type: ${l.type}`);
    console.log(`  Bounds: ${JSON.stringify(l.bounds)}`);
  });
});
