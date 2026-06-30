const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

// Check state 0's SVG for mask-group elements with data-motion-id
const state0 = manifest.states[0];
const dom = new JSDOM(state0.svg);
const doc = dom.window.document;
const all = doc.querySelectorAll('[data-motion-id]');
console.log('All data-motion-id elements in state 0 SVG:');
all.forEach(el => {
  const mid = el.getAttribute('data-motion-id');
  if (mid.includes('piechart') || mid.includes('mask-group')) {
    console.log('  ', el.tagName, mid);
  }
});

// Check if state 0 layers match what we expect
console.log('\nstate 0 layers:');
const s0layers = state0.layers.filter(l => l.stableNodeId.includes('mask-group'));
s0layers.forEach(l => console.log('  ', l.stableNodeId));
