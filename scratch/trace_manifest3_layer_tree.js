const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest3.json', 'utf8'));

manifest.states.forEach((state, stateIdx) => {
  console.log(`\n================ State ${stateIdx}: ${state.name} ================`);
  const layers = state.layers;
  const byId = new Map(layers.map(l => [l.id, l]));
  
  // Build parent-child relationships
  // We can see that parent ID is not stored directly on layers in some versions, but let's check what properties exist on layer.
  if (layers.length > 0) {
    console.log("Keys on layer:", Object.keys(layers[0]));
  }
  
  layers.forEach(l => {
    if (l.type === 'TEXT' || l.name.includes('Icon') || l.name.includes('Line')) {
      console.log(`Layer: "${l.name}" (ID: ${l.id}, Type: ${l.type})`);
      if (l.parentId) {
        console.log(`  Parent: "${byId.has(l.parentId) ? byId.get(l.parentId).name : l.parentId}"`);
      }
    }
  });
});
