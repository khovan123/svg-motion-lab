const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgText = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svgText, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

const ring = doc.querySelector('[data-exact-ring]');
if (ring && ring.children.length > 0) {
  console.log("Child 0 XML:");
  console.log(ring.children[0].innerHTML);
} else {
  console.log("No exact ring or children found!");
}
