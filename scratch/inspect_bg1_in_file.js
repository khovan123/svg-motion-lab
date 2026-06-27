const fs = require('fs');
const { JSDOM } = require('jsdom');

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

const el = doc.querySelector('[data-motion-id="1:4181:@root/background[1]"]');
if (el) {
  console.log(`Tag: ${el.tagName.toLowerCase()}`);
  console.log(`HTML: ${el.outerHTML}`);
} else {
  console.log("Not found in file!");
}
