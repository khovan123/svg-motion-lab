const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state = manifest.states[2];

console.log("Does raw State 2 SVG contain data-motion-id?");
const count = (state.svg.match(/data-motion-id/g) || []).length;
console.log(`Count: ${count}`);

console.log("\nSome elements in raw State 2 SVG containing data-motion-id:");
const dom = new (require('jsdom').JSDOM)(state.svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;
const elements = doc.querySelectorAll('[data-motion-id]');
Array.from(elements).slice(0, 10).forEach(el => {
  console.log(`  Tag: ${el.tagName.toLowerCase()}, ID: ${el.getAttribute('data-motion-id')}, x=${el.getAttribute('x')}, y=${el.getAttribute('y')}, w=${el.getAttribute('width')}, h=${el.getAttribute('height')}`);
});
