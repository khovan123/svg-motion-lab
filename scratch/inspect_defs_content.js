const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgContent = fs.readFileSync('dist/animation.svg', 'utf8');
const doc = new JSDOM(svgContent, { contentType: 'image/svg+xml' }).window.document;

const defs = doc.querySelector('defs');
console.log("Defs found:", !!defs);

const masks = defs.querySelectorAll('mask');
console.log("\nMasks inside <defs> count:", masks.length);
masks.forEach((mask, idx) => {
  if (idx < 5) {
    console.log(`Mask ID="${mask.id}":`);
    console.log(mask.outerHTML);
  }
});
