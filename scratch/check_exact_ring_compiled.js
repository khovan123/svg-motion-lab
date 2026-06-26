const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgContent = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svgContent, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

const exactRing = doc.querySelector('[data-exact-ring]');
if (!exactRing) {
  console.log("NOT FOUND data-exact-ring!");
  process.exit(1);
}

console.log("Exact Ring children count:", exactRing.children.length);
Array.from(exactRing.children).forEach((child, idx) => {
  const stateAttr = child.getAttribute('data-ring-state');
  console.log(`\nChild [${idx}]: Tag=<${child.tagName}>, data-ring-state=${stateAttr}`);
  if (child.tagName.toLowerCase() === 'g' && stateAttr !== null) {
    console.log(`  Wrapper child elements count:`, child.children.length);
    Array.from(child.children).forEach((el, elIdx) => {
      console.log(`    Sub-child [${elIdx}]: Tag=<${el.tagName}>, mask="${el.getAttribute('mask') || ''}"`);
      const paths = el.querySelectorAll('path');
      paths.forEach((p, pIdx) => {
        console.log(`      Path [${pIdx}]: fill="${p.getAttribute('fill') || ''}"`);
      });
    });
  } else {
    // This should be the static background ring!
    console.log(`  Background Ring Element details:`);
    const paths = child.querySelectorAll('path');
    paths.forEach((p, pIdx) => {
      console.log(`    Path [${pIdx}]: fill="${p.getAttribute('fill') || ''}"`);
    });
  }
});
