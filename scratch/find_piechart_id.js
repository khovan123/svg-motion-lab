const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const query = '4234'; // last digits of 1:4234
const state0 = manifest.states[0];
console.log("Searching state 0 SVG for substring:", query);
if (state0.svg.includes(query)) {
  console.log("Found substring in SVG!");
  // Find where it is
  const idx = state0.svg.indexOf(query);
  console.log(state0.svg.slice(Math.max(0, idx - 100), idx + 200));
} else {
  console.log("Substring NOT found in state 0 SVG.");
}
