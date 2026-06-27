const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

console.log("All elements matching hugeiconsrefresh in compiled SVG:");
doc.querySelectorAll('*').forEach((el, idx) => {
  const id = el.getAttribute('id') || '';
  const motionId = el.getAttribute('data-motion-id') || '';
  if (id.includes('hugeiconsrefresh') || motionId.includes('hugeiconsrefresh')) {
    console.log(`Index ${idx}: <${el.tagName}> id="${id}" data-motion-id="${motionId}" fill="${el.getAttribute('fill') || ''}" opacity="${el.getAttribute('opacity') || ''}" visibility="${el.getAttribute('visibility') || ''}" parent="<${el.parentNode.tagName}>"`);
  }
});
