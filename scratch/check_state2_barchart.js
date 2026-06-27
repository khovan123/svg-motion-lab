const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
const { window } = dom;
global.DOMParser = window.DOMParser;

const state = manifest.states[2];
const doc = new DOMParser().parseFromString(state.svg, 'image/svg+xml');
const els = doc.querySelectorAll('[data-motion-id]');
console.log(`All data-motion-ids in State 2 SVG containing 'bar-chart':`);
els.forEach(el => {
  const id = el.getAttribute('data-motion-id');
  if (id.includes('bar-chart')) {
    console.log(`  Tag: ${el.tagName}, data-motion-id: ${id}`);
  }
});
