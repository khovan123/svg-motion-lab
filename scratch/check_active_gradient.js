const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgStr = fs.readFileSync('dist/animation.svg', 'utf8');
const { window } = new JSDOM(svgStr, { contentType: 'image/svg+xml' });
const doc = window.document;

console.log("=== Active columns gradients in <defs> ===");
doc.querySelectorAll('linearGradient, radialGradient').forEach(grad => {
  const id = grad.getAttribute('id') || '';
  if (id.includes('state2') || id.includes('state4') || id.includes('state6')) {
    console.log(`Gradient ID: ${id}`);
    console.log(`  HTML: ${grad.outerHTML}`);
  }
});
