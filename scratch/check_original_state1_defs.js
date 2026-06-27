const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state1 = manifest.states[1];

const { JSDOM } = require('jsdom');
const dom = new JSDOM();
const parser = new dom.window.DOMParser();
const doc = parser.parseFromString(state1.svg, 'image/svg+xml');

console.log("=== Original State 1 SVG Defs ===");
doc.documentElement.querySelectorAll('linearGradient, radialGradient, clipPath, mask, filter').forEach(el => {
  console.log(`Tag: <${el.tagName}> id="${el.getAttribute('id')}"`);
});

console.log("\n=== Original State 1 SVG Path Fills ===");
doc.documentElement.querySelectorAll('path').forEach(p => {
  const fill = p.getAttribute('fill');
  if (fill && fill.startsWith('url(')) {
    console.log(`Path fill="${fill}"`);
  }
});
