const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

// Find first state with mask-group[0..3] in SVG
let foundState = null;
for (let i = 0; i < manifest.states.length; i++) {
  const state = manifest.states[i];
  if (state.layers && state.layers.some(l => l.stableNodeId === '1:4181:@root/piechart[0]/mask-group[1]')) {
    foundState = { idx: i, state };
    break;
  }
}

if (!foundState) {
  console.log('No state with mask-group[1] layer found');
  process.exit(1);
}

const { idx, state } = foundState;
console.log(`State ${idx}: ${state.name} (${state.id})`);

// Get mask-group layers and their children
const maskGroupLayers = state.layers.filter(l => l.stableNodeId.match(/mask-group\[\d\]$/) || l.stableNodeId.includes('mask-group['));
maskGroupLayers.forEach(l => {
  const children = state.layers.filter(c => c.parentStableNodeId === l.stableNodeId);
  console.log('  layer:', l.stableNodeId, '  children:', children.map(c => c.stableNodeId).join(', '));
});
