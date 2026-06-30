const fs = require('fs');
const { JSDOM } = require('jsdom');

const svg = fs.readFileSync('scratch/dist-patched/animation.svg', 'utf8');
const dom = new JSDOM(svg);
const doc = dom.window.document;
const elements = doc.querySelectorAll('[data-motion-id]');
const ids = new Set();
elements.forEach(el => {
  const id = el.getAttribute('data-motion-id');
  if (id.includes('mask-group')) {
    ids.add(id);
  }
});
console.log([...ids].sort());
