const fs = require('fs');

const m = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const piechartLayers = [];
m.states.forEach(s => {
  s.layers.forEach(l => {
    if (l.name.toLowerCase().includes('pie') || l.id.toLowerCase().includes('pie')) {
      piechartLayers.push({ state: s.name, name: l.name, id: l.id, stableId: l.stableNodeId });
    }
  });
});
console.log("Pie chart layers in motion-manifest.json:", piechartLayers.slice(0, 10));
