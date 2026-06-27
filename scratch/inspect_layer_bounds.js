const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

// Print bounds of card-1, card-2, card-3, and their avatars across all states
const targetLayerNames = ['Card 1', 'Card 2', 'Card 3', 'Avatar'];

manifest.states.forEach(state => {
  if (state.name !== 'Property 1=1' && state.name !== 'Property 1=2') return;
  console.log(`\n--- State: ${state.name} ---`);
  state.layers.forEach(layer => {
    if (targetLayerNames.includes(layer.name) || layer.stableNodeId.includes('card')) {
      console.log(`  Layer: ${layer.name} (${layer.type})`);
      console.log(`    stableNodeId: ${layer.stableNodeId}`);
      console.log(`    bounds: ${JSON.stringify(layer.bounds)}`);
      console.log(`    rotation: ${layer.rotation || 0}`);
      console.log(`    opacity: ${layer.opacity === undefined ? 1 : layer.opacity}`);
    }
  });
});
