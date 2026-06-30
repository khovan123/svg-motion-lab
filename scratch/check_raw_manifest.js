const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

console.log('States in JSON file:', manifest.states.length);
manifest.states.forEach((s, idx) => {
  const l = s.layers.find(l => l.stableNodeId.includes('1st-column[0]/active[0]'));
  if (l) {
    console.log(`State ${idx} (${s.id}): visible = ${l.visible}`);
  } else {
    console.log(`State ${idx} (${s.id}): NOT FOUND`);
  }
});
