const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

console.log("Active columns heights across states:");
manifest.states.forEach((state, sIdx) => {
  console.log(`\nState ${sIdx} (${state.name}):`);
  const activeLayers = state.layers.filter(l => l.name === 'Active' && l.stableNodeId.includes('bar-chart'));
  activeLayers.forEach(l => {
    console.log(`  StableNodeId: ${l.stableNodeId}`);
    console.log(`    Bounds: ${JSON.stringify(l.bounds)}`);
  });
});
