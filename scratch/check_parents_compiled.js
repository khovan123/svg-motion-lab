const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

const activeEl = doc.querySelector('[data-motion-id="1:4181:@root/bar-chart[0]/2nd-column[0]/active[0]"]');
if (activeEl) {
  console.log("Active element found. Parent tag:", activeEl.parentNode.tagName, "Parent data-motion-id:", activeEl.parentNode.getAttribute('data-motion-id'));
} else {
  console.log("Active element not found!");
}
