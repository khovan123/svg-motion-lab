const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgText = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svgText, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

const ring = doc.querySelector('[data-exact-ring]');
if (!ring) {
  console.log("data-exact-ring NOT found!");
} else {
  console.log(`Found data-exact-ring: tag = <${ring.tagName}>, parent = <${ring.parentElement.tagName}>`);
  console.log("Children count:", ring.children.length);
  Array.from(ring.children).forEach((child, idx) => {
    console.log(`Child ${idx}: tag = <${child.tagName}>, data-ring-state = ${child.getAttribute('data-ring-state')}, opacity = ${child.getAttribute('opacity')}, visibility = ${child.getAttribute('visibility')}`);
    // Print its children or details
    const paths = child.querySelectorAll('path');
    console.log(`  Paths count: ${paths.length}`);
    paths.forEach((p, pIdx) => {
      console.log(`    Path ${pIdx}: d = ${p.getAttribute('d').slice(0, 50)}..., fill = ${p.getAttribute('fill')}`);
    });
  });
}
