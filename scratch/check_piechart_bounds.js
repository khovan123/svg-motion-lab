const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

console.log("Piechart layer bounds in all states:");
manifest.states.forEach((state, idx) => {
  const layer = state.layers.find(l => l.stableNodeId.includes('piechart'));
  if (layer) {
    console.log(`State ${idx} (${state.name}):`, JSON.stringify(layer.bounds));
  } else {
    console.log(`State ${idx} (${state.name}): NOT found`);
  }
});
