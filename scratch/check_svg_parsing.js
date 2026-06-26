const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
const { window } = dom;
global.DOMParser = window.DOMParser;
global.XMLSerializer = window.XMLSerializer;

const state = manifest.states[0];
const doc = new DOMParser().parseFromString(state.svg, 'image/svg+xml');
const els = doc.querySelectorAll('[data-motion-id]');
console.log(`Found ${els.length} elements with data-motion-id in State 0 SVG`);
els.forEach(el => {
  const id = el.getAttribute('data-motion-id');
  if (id.includes('background') || id.includes('mask-group')) {
    console.log(`  Tag: ${el.tagName}, data-motion-id: ${id}`);
  }
});
