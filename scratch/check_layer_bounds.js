const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const layerId = '1:4181:@root/bar-chart[0]/1st-column[0]/active[0]';
manifest.states.forEach((s, idx) => {
  const layer = s.layers.find(l => l.stableNodeId === layerId);
  if (layer) {
    console.log(`State ${idx} (${s.id}): bounds = ${JSON.stringify(layer.bounds)}, visible = ${layer.visible}`);
  } else {
    console.log(`State ${idx} (${s.id}): NOT FOUND`);
  }
});
