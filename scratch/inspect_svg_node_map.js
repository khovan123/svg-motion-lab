const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state = manifest.states[0];

console.log('svgNodeMap type:', typeof state.svgNodeMap);
if (state.svgNodeMap) {
  const keys = Object.keys(state.svgNodeMap);
  console.log('Total entries in svgNodeMap:', keys.length);
  console.log('First 20 entries:');
  keys.slice(0, 20).forEach(k => {
    console.log(`  "${k}": ${JSON.stringify(state.svgNodeMap[k])}`);
  });
}
