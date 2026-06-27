const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

manifest.states.forEach((state, sIdx) => {
  console.log(`\nState ${sIdx} (${state.name}):`);
  const refreshLayers = state.layers.filter(l => l.name.toLowerCase().includes('refresh') || l.name.toLowerCase().includes('container') || l.name.toLowerCase().includes('vector'));
  refreshLayers.forEach(l => {
    console.log(`  Layer: ${l.name}`);
    console.log(`    StableNodeId: ${l.stableNodeId}`);
    console.log(`    Rotation: ${l.rotation}`);
    console.log(`    Bounds: ${JSON.stringify(l.bounds)}`);
  });
});
