const fs = require('fs');
const { JSDOM } = require('jsdom');

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

console.log("All elements with data-motion-id containing 'hugeiconsrefresh':");
doc.querySelectorAll('*').forEach(el => {
  const id = el.getAttribute('data-motion-id') || '';
  if (id.includes('hugeiconsrefresh')) {
    console.log(`- Element: Tag=${el.tagName}, ID=${id}, hasTransform=${el.hasAttribute('transform')}, transform=${el.getAttribute('transform') || ''}`);
    // If it has children, print them too
    Array.from(el.children).forEach((child, cIdx) => {
      console.log(`    Child [${cIdx}]: Tag=${child.tagName}, ID=${child.getAttribute('data-motion-id') || 'none'}`);
    });
  }
});
