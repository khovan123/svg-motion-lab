const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state0 = manifest.states[0];

// Check where bar-chart and piechart elements are in the raw SVG
const dom = new JSDOM(state0.svg);
const doc = dom.window.document;

// Print all g elements in SVG order
const allGs = doc.querySelectorAll('g');
console.log('All g elements in state 0 SVG (with data-motion-id):');
allGs.forEach(g => {
  const mid = g.getAttribute('data-motion-id') || '';
  if (mid) {
    const childCount = g.children.length;
    console.log('  ', mid, 'children:', childCount);
  }
});
