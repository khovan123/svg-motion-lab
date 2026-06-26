const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

console.log("Searching layers matching 'refresh' or 'hugeicons'...");
manifest.states.forEach((state, sIdx) => {
  state.layers.forEach((layer, lIdx) => {
    if (layer.name.toLowerCase().includes('refresh') || layer.name.toLowerCase().includes('hugeicons') || layer.id.includes('1:4250')) {
      console.log(`State ${sIdx} (${state.name}): id = ${layer.id}, stableNodeId = ${layer.stableNodeId}, name = ${layer.name}, type = ${layer.type}, rotation = ${layer.rotation}`);
    }
  });
});
