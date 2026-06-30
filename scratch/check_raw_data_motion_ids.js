const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state0 = manifest.states[0];
const dom = new JSDOM(state0.svg);
const doc = dom.window.document;

console.log('All elements with data-motion-id in state 0 raw SVG:');
doc.querySelectorAll('[data-motion-id]').forEach(el => {
  console.log('  ', el.tagName, el.getAttribute('data-motion-id'));
});
