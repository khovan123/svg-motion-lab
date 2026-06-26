const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

manifest.states.forEach((state, sIdx) => {
  console.log(`\nState ${sIdx} (${state.name})`);
  state.layers.forEach(l => {
    if (l.name === 'Background' || l.name === 'Active' || l.name.includes('column')) {
      console.log(`  Name: ${l.name}, StableNodeId: ${l.stableNodeId}`);
    }
  });
});
