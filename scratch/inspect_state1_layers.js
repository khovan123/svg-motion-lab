const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state1 = manifest.states.find(s => s.id === '1:4182');
console.log(`State 1 layers:`);
state1.layers.forEach(l => {
  console.log(`- ${l.name} (${l.type}), stableNodeId: ${l.stableNodeId}`);
});
