const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

console.log("Searching layers in State 0 containing 'pie' or 'chart' or 'ring' or 'donut'...");
manifest.states[0].layers.forEach((layer, lIdx) => {
  if (layer.name.toLowerCase().includes('pie') || layer.name.toLowerCase().includes('chart') || layer.name.toLowerCase().includes('ring')) {
    console.log(`Layer ${lIdx}: id = ${layer.id}, stableNodeId = ${layer.stableNodeId}, name = ${layer.name}, type = ${layer.type}`);
  }
});
