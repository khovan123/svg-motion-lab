const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state0 = manifest.states[0];
console.log("Does raw manifest state 0 SVG contain 'data-motion-id'?");
console.log(state0.svg.includes('data-motion-id'));
