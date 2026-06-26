const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgContent = fs.readFileSync('dist/animation.svg', 'utf8');
const doc = new JSDOM(svgContent, { contentType: 'image/svg+xml' }).window.document;

const ring = doc.querySelector('[data-exact-ring]');
const defs = doc.querySelector('defs');

if (ring && defs) {
  const elements = ring.querySelectorAll('*');
  const missing = [];
  
  elements.forEach(el => {
    ['fill', 'stroke', 'filter', 'clip-path', 'mask'].forEach(attr => {
      if (el.hasAttribute(attr)) {
        const val = el.getAttribute(attr);
        const match = val.match(/url\(#([^\)]+)\)/);
        if (match) {
          const id = match[1];
          const defEl = defs.querySelector(`#${id}`);
          if (!defEl) {
            missing.push({ tag: el.tagName, id: el.getAttribute('data-motion-id') || 'clone', attr, val, missingId: id });
          }
        }
      }
    });
  });
  
  console.log("Missing defs count:", missing.length);
  if (missing.length > 0) {
    console.log("Missing defs details:", JSON.stringify(missing, null, 2));
  } else {
    console.log("All referenced defs exist in <defs>!");
  }
} else {
  console.log("Ring or defs not found!");
}
