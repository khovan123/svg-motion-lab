const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[0];
const layer = state.layers.find(l => l.stableNodeId.includes('hugeiconsrefresh'));
console.log('Layer hugeiconsrefresh:', layer ? { stableNodeId: layer.stableNodeId, type: layer.type } : 'NOT FOUND');
