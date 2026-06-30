const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states.find(s => s.id === '1:4254');
const parentIdx = state.layers.findIndex(l => l.stableNodeId === '1:4181:@root/piechart[0]/mask-group[2]');
const childIdx = state.layers.findIndex(l => l.stableNodeId === '1:4181:@root/piechart[0]/mask-group[2]/blue[0]');
console.log(`Parent index: ${parentIdx}, Child index: ${childIdx}`);
