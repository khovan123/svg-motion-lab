const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[2];
const layer = state.layers.find(l => l.stableNodeId.includes('1st-column[0]/active'));
console.log("State 2 1st column active properties:");
console.log(JSON.stringify(layer, null, 2));
