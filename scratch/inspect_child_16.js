const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[0];
const dom = new JSDOM(state.svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

const child16 = doc.documentElement.children[16];
if (child16) {
  console.log("Child 16 outerHTML:");
  console.log(child16.outerHTML);
  console.log("has stroke-dasharray:", child16.hasAttribute('stroke-dasharray'));
  console.log("stroke-dasharray value:", child16.getAttribute('stroke-dasharray'));
}
