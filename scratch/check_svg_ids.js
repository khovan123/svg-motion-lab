const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
const { window } = dom;
global.DOMParser = window.DOMParser;

const state = manifest.states[2];
const doc = new DOMParser().parseFromString(state.svg, 'image/svg+xml');
const els = doc.querySelectorAll('*');
console.log("State 2 SVG elements with 'id' and 'data-motion-id':");
els.forEach(el => {
  const idAttr = el.getAttribute('id');
  const motionId = el.getAttribute('data-motion-id');
  if (idAttr || motionId) {
    console.log(`  Tag: ${el.tagName}, id: "${idAttr || 'none'}", data-motion-id: "${motionId || 'none'}"`);
  }
});
