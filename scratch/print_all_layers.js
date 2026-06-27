const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

[0, 2].forEach(sIdx => {
  const state = manifest.states[sIdx];
  console.log(`\n================ State ${sIdx} (${state.name}) Layers ================`);
  state.layers.forEach(l => {
    console.log(`  Name: "${l.name}", Type: ${l.type}, stableNodeId: "${l.stableNodeId}"`);
  });
});
