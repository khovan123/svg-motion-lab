const fs = require('fs');
const { JSDOM } = require('jsdom');

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svg);
const doc = dom.window.document;
const elements = doc.querySelectorAll('[data-motion-id]');
const ids = new Set();
elements.forEach(el => {
  ids.add(el.getAttribute('data-motion-id'));
});
console.log('Motion IDs in dist/animation.svg:');
console.log([...ids].sort());
