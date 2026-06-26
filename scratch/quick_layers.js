const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

// Focus on first few layers for state 0 and 3
[0, 3].forEach(stateIdx => {
  const state = manifest.states[stateIdx];
  console.log(`\n================ State ${stateIdx}: ${state.name} ================`);
  
  state.layers.forEach((layer, layerIdx) => {
    console.log(`  [${layerIdx}] "${layer.name}" key=${layer.key} type=${layer.type} bounds=${JSON.stringify(layer.bounds)} opacity=${layer.opacity}`);
    if (layer.svg) console.log(`       svg length: ${layer.svg.length}`);
  });
});
