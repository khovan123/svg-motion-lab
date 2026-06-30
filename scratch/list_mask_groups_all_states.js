const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

// Check all states to see different mask-group IDs
manifest.states.forEach((state, idx) => {
  const pielayers = state.layers.filter(l => l.stableNodeId.includes('mask-group'));
  if (pielayers.length > 0) {
    console.log(`\nState ${idx} (${state.name || state.id}):`);
    pielayers.forEach(l => console.log('  ', l.stableNodeId));
  }
});
