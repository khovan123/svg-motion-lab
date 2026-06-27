const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[0];
const dom = new (require('jsdom').JSDOM)(state.svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

console.log("All rect elements in State 0 SVG:");
doc.querySelectorAll('rect').forEach((el, idx) => {
  console.log(`[${idx}] ID: ${el.getAttribute('data-motion-id')}, x=${el.getAttribute('x')}, y=${el.getAttribute('y')}, w=${el.getAttribute('width')}, h=${el.getAttribute('height')}, transform=${el.getAttribute('transform')}, opacity=${el.getAttribute('opacity')}, fill-opacity=${el.getAttribute('fill-opacity')}`);
});
