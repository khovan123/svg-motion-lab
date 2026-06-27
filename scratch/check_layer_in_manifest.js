const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

manifest.states.forEach((state, stateIdx) => {
  console.log(`\nState ${stateIdx} (${state.name}):`);
  const layers = state.layers || [];
  const layer = layers.find(l => l.key === '@root/doc-icon[0]/background[0]' || l.stableNodeId === '1:4475:@root/doc-icon[0]/background[0]');
  if (layer) {
    console.log("Layer:", JSON.stringify(layer, null, 2));
  } else {
    console.log("NOT FOUND in layers list!");
  }
});
