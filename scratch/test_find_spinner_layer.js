const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[0];
const target = '/hugeiconsrefresh-03-stroke-rounded-1[0]';

console.log("State 0 top-level layers:");
state.layers.forEach(layer => {
  console.log(`- type=${layer.type}, name="${layer.name}", stableNodeId="${layer.stableNodeId}"`);
});

const found = state.layers.find(item => item.type === 'FRAME' && String(item.stableNodeId || '').includes(target));
console.log("Found layer by find:", found ? found.id : 'NOT FOUND');
