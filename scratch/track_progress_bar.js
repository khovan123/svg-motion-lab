const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

// Show progress bar related layers across all states
const keys = ['@root/bar[0]', '@root/active[0]', '@root/number[0]'];

manifest.states.forEach((state, stateIdx) => {
  console.log(`\n--- State ${stateIdx}: ${state.name} ---`);
  for (const layer of state.layers) {
    if (keys.includes(layer.key)) {
      console.log(`  "${layer.name}" key=${layer.key}`);
      console.log(`    bounds: ${JSON.stringify(layer.bounds)}`);
      console.log(`    cornerRadius: ${JSON.stringify(layer.cornerRadius)}`);
      console.log(`    fills: ${JSON.stringify(layer.fills).substring(0, 300)}`);
      if (layer.text) console.log(`    text: ${JSON.stringify(layer.text).substring(0, 200)}`);
      if (layer.svg) console.log(`    svg: ${layer.svg.substring(0, 300)}`);
      if (layer.vectorPaths && layer.vectorPaths.length) console.log(`    vectorPaths: ${JSON.stringify(layer.vectorPaths).substring(0, 200)}`);
      console.log(`    effects: ${JSON.stringify(layer.effects).substring(0, 200)}`);
    }
  }
});
