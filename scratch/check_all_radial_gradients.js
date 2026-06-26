const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgStr = fs.readFileSync('dist/animation.svg', 'utf8');
const { window } = new JSDOM(svgStr, { contentType: 'image/svg+xml' });
const doc = window.document;

console.log("=== Radial Gradients in <defs> ===");
doc.querySelectorAll('radialGradient').forEach(grad => {
  const id = grad.getAttribute('id') || '';
  if (id.includes('paint19') || id.includes('paint11') || id.includes('paint18') || id.includes('paint17')) {
    console.log(`Gradient ID: ${id}`);
    console.log(`  stops count: ${grad.children.length}`);
    Array.from(grad.children).forEach(stop => {
      console.log(`    stop: offset=${stop.getAttribute('offset')}, color=${stop.getAttribute('stop-color')}, opacity=${stop.getAttribute('stop-opacity') || '1'}`);
    });
  }
});
