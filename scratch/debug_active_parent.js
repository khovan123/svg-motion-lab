const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
const { window } = dom;
global.DOMParser = window.DOMParser;
global.XMLSerializer = window.XMLSerializer;

const state = manifest.states[2];
const doc = new DOMParser().parseFromString(state.svg, 'image/svg+xml');
const active = doc.querySelector('[data-motion-id*="4th-column[0]/active"]');
if (active) {
  console.log("Found Active element in State 2 SVG:");
  let current = active;
  const path = [];
  while (current) {
    const name = current.tagName || 'document';
    const id = (current.getAttribute && current.getAttribute('data-motion-id')) ? `[data-motion-id="${current.getAttribute('data-motion-id')}"]` : '';
    path.unshift(name + id);
    current = current.parentNode;
  }
  console.log(path.join(' -> '));
  console.log("Active element outer HTML:");
  console.log(new XMLSerializer().serializeToString(active));
} else {
  console.log("Could not find Active element in State 2 SVG!");
}
