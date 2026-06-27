const fs = require('fs');
const { JSDOM } = require('jsdom');

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const doc = new JSDOM(svg, { contentType: 'image/svg+xml' }).window.document;

console.log("All data-motion-ids in dist/animation.svg:");
const ids = new Set();
doc.querySelectorAll('[data-motion-id]').forEach(el => {
  ids.add(el.getAttribute('data-motion-id'));
});

Array.from(ids).sort().forEach(id => {
  console.log(`- ${id}`);
});
