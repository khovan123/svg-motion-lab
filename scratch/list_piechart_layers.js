const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state = manifest.states[0];

const pielayers = state.layers.filter(l => l.stableNodeId.includes('piechart') || l.stableNodeId.includes('mask-group'));
pielayers.forEach(l => console.log(l.stableNodeId, '  type:', l.type, '  parent:', l.parentStableNodeId));
