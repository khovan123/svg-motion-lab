const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

manifest.states.forEach(state => {
  console.log(`State: ${state.name}`);
  state.layers.forEach(layer => {
    if (['Card 1', 'Card 2', 'Card 3'].includes(layer.name) && layer.stableNodeId.endsWith('card-1[0]') || layer.stableNodeId.endsWith('card-2[0]') || layer.stableNodeId.endsWith('card-3[0]')) {
      if (layer.type === 'FRAME') {
        console.log(`  ${layer.name}: bounds=${JSON.stringify(layer.bounds)}, opacity=${layer.opacity === undefined ? 1 : layer.opacity}`);
      }
    }
  });
});
