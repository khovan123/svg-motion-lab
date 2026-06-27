const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[0];
console.log(`State 0 (${state.name}) layers:`);
state.layers.forEach(l => {
  if (l.name.includes('Chart') || l.name.includes('chart') || l.name.includes('Pie') || l.name.includes('Bar') || l.name.includes('Refresh') || l.name.includes('refresh') || l.name.includes('Icon') || l.name.includes('icon')) {
    console.log(`  Name: ${l.name}, Type: ${l.type}, stableNodeId: ${l.stableNodeId}`);
  }
});
