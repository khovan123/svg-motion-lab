const fs = require('fs');
const path = require('path');
const { compileFile } = require('../src/figma-motion-compiler');

const result = compileFile('motion-manifest.json', { loop: true });
console.log("Compile finished. SVG length:", result.svg.length);

const { JSDOM } = require('jsdom');
const dom = new JSDOM();
const parser = new dom.window.DOMParser();
const doc = parser.parseFromString(result.svg, 'image/svg+xml');

console.log("=== Paths in Compiled SVG ===");
doc.querySelectorAll('path').forEach(p => {
  const mid = p.getAttribute('data-motion-id');
  if (mid && mid.includes('active')) {
    console.log(`- Path data-motion-id="${mid}" fill="${p.getAttribute('fill')}"`);
  }
});
