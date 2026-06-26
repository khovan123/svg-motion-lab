const fs = require('fs');
const { JSDOM } = require('jsdom');

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

const container = doc.querySelector('[data-motion-id*="container[0]"]');
if (container) {
  console.log(`Container tag: <${container.tagName} data-motion-id="${container.getAttribute('data-motion-id')}">`);
  console.log(`Container outerHTML slice: ${container.outerHTML.slice(0, 300)}`);
} else {
  console.log("Container not found!");
}
