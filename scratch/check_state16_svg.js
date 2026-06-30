const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

// Check state 16 SVG more carefully
const state = manifest.states[16];
const dom = new JSDOM(state.svg);
const doc = dom.window.document;
const all = doc.querySelectorAll('[data-motion-id]');
console.log('State 16 SVG data-motion-id elements:');
all.forEach(el => {
  const mid = el.getAttribute('data-motion-id');
  if (mid.includes('piechart') || mid.includes('mask-group')) {
    console.log('  ', el.tagName, mid);
  }
});
