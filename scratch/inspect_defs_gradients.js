const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgContent = fs.readFileSync('dist/animation.svg', 'utf8');
const doc = new JSDOM(svgContent, { contentType: 'image/svg+xml' }).window.document;

const defs = doc.querySelector('defs');
const gradients = defs.querySelectorAll('radialGradient, linearGradient');
console.log("Gradients count in defs:", gradients.length);

gradients.forEach((g, idx) => {
  if (g.id.includes('paint5') || g.id.includes('paint8') || g.id.includes('paint9') || idx < 5) {
    console.log(`\nGradient ID="${g.id}":`);
    console.log(g.outerHTML);
  }
});
