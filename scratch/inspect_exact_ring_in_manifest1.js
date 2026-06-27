const fs = require('fs');
const { JSDOM } = require('jsdom');

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const doc = new JSDOM(svg, { contentType: 'image/svg+xml' }).window.document;

const el = doc.querySelector('[data-exact-ring]');
if (el) {
  console.log("Found element with data-exact-ring! Tag:", el.tagName, "Attributes:", Array.from(el.attributes).map(a => `${a.name}="${a.value}"`).join(', '));
} else {
  console.log("No element with data-exact-ring found!");
}
