const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgContent = fs.readFileSync('dist/animation.svg', 'utf8');
const doc = new JSDOM(svgContent, { contentType: 'image/svg+xml' }).window.document;

// Get all fill/stroke url references in exact-ring
const ring = doc.querySelector('[data-exact-ring]');
console.log("Ring found:", !!ring);
if (ring) {
  const elements = ring.querySelectorAll('*');
  const refs = new Set();
  elements.forEach(el => {
    ['fill', 'stroke', 'filter', 'clip-path', 'mask'].forEach(attr => {
      if (el.hasAttribute(attr)) {
        const val = el.getAttribute(attr);
        console.log(`Element <${el.tagName}> in ring has ${attr}="${val}"`);
        const match = val.match(/url\(#([^\)]+)\)/);
        if (match) refs.add(match[1]);
      }
    });
  });
  
  console.log("\nReferenced IDs in exact-ring:", [...refs]);
  
  // Check if they exist in <defs>
  const defs = doc.querySelector('defs');
  console.log("\nChecking definitions in <defs>:");
  refs.forEach(id => {
    const defEl = defs.querySelector(`#${id}`);
    console.log(`  ID "${id}" exists in <defs>:`, !!defEl);
    if (defEl) {
      console.log(`    Tag: <${defEl.tagName}>`);
    }
  });
}
