const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

console.log("Elements in compiled SVG matching 2nd-column:");
doc.querySelectorAll('[data-motion-id*="2nd-column"]').forEach(el => {
  console.log(`<${el.tagName}> data-motion-id="${el.getAttribute('data-motion-id')}" fill="${el.getAttribute('fill') || ''}" opacity="${el.getAttribute('opacity') || ''}" visibility="${el.getAttribute('visibility') || ''}"`);
});
