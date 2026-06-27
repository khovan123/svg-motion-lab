const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

const el = doc.querySelector('[data-motion-id="1:4181:@root/bar-chart[0]/4th-column[0]"]');
if (!el) {
  console.log("Not found!");
  process.exit(1);
}

let curr = el;
while (curr) {
  const tag = curr.tagName.toLowerCase();
  const id = curr.getAttribute('id') || '';
  const motionId = curr.getAttribute('data-motion-id') || '';
  console.log(`<${tag}> id="${id}" data-motion-id="${motionId}"`);
  curr = curr.parentNode;
}
