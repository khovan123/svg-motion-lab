const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const parentId = '1:4181:@root/bar-chart[0]/1st-column[0]';
manifest.states.forEach((s, idx) => {
  const layer = s.layers.find(l => l.stableNodeId === parentId);
  console.log(`State ${idx} (${s.id}): parent found = ${!!layer}, visible = ${layer ? layer.visible : 'N/A'}`);
});
