const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest3.json', 'utf8'));

manifest.states.forEach((state, stateIdx) => {
  console.log(`\n================ State ${stateIdx}: ${state.name} ================`);
  const layers = state.layers;
  const byKey = new Map(layers.map(l => [l.key, l]));
  
  layers.forEach(l => {
    if (l.type === 'TEXT' || l.name.includes('Icon') || l.name.includes('Line')) {
      const parent = l.parentKey ? byKey.get(l.parentKey) : null;
      console.log(`Layer: "${l.name}" | ID: ${l.id} | parentKey: ${l.parentKey} -> "${parent ? parent.name : 'none'}" | parentStableNodeId: ${l.parentStableNodeId}`);
    }
  });
});
