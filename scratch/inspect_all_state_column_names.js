const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

manifest.states.forEach((state, sIdx) => {
  console.log(`\nState ${sIdx} (${state.name}):`);
  const activeLayers = state.layers.filter(l => l.name.includes('Active') && l.stableNodeId.includes('bar-chart'));
  activeLayers.forEach(l => {
    console.log(`  Name: ${l.name}, StableNodeId: ${l.stableNodeId}`);
  });
});
