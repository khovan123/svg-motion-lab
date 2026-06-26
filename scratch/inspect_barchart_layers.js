const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

manifest.states.forEach((state, stateIdx) => {
  console.log(`\n================ State ${stateIdx}: ${state.name} ================`);
  const barChartLayers = state.layers.filter(l => l.name.toLowerCase().includes('column') || l.name.toLowerCase().includes('bar') || l.name.toLowerCase().includes('active') || l.name.toLowerCase().includes('background'));
  barChartLayers.forEach(l => {
    console.log(`Layer: name="${l.name}"`);
    console.log(`  id: "${l.id}"`);
    console.log(`  stableNodeId: "${l.stableNodeId}"`);
    console.log(`  parentStableNodeId: "${l.parentStableNodeId}"`);
    console.log(`  semanticPath: "${l.semanticPath}"`);
    console.log(`  opacity: ${l.opacity}`);
    console.log(`  visible: ${l.visible}`);
  });
});
