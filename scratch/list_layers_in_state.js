const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states.find(s => s.id === '1:4254');
console.log(`Layers in state 1:4254 (${state.name}):`);
state.layers.forEach(l => {
  if (l.stableNodeId.includes('active')) {
    console.log(`  id = ${l.id}, stableNodeId = ${l.stableNodeId}, visible = ${l.visible}`);
  }
});
