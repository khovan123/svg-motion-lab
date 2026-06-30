const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[0];
const lines = state.svg.split('\n');
console.log('Outer SVG structure of state 0 (first 25 lines):');
for (let i = 0; i < 25; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
