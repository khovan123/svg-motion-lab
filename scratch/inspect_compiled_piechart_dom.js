const fs = require('fs');
const { JSDOM } = require('jsdom');

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

const piechart = doc.querySelector('[data-motion-id="1:4181:@root/piechart[0]"]');
if (piechart) {
  console.log("Piechart DOM structure:");
  // Let's print tag and data-motion-id for all descendants
  const printDescendants = (node, indent = "") => {
    const tag = node.tagName.toLowerCase();
    const id = node.getAttribute('data-motion-id') || 'none';
    console.log(`${indent}<${tag} data-motion-id="${id}">`);
    Array.from(node.children).forEach(child => printDescendants(child, indent + "  "));
  };
  printDescendants(piechart);
} else {
  console.log("Piechart not found in compiled SVG!");
}
