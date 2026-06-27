const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
const { window } = dom;
global.DOMParser = window.DOMParser;
global.XMLSerializer = window.XMLSerializer;

const state = manifest.states[2];
const doc = new DOMParser().parseFromString(state.svg, 'image/svg+xml');
const col = doc.querySelector('[data-motion-id*="1st-column[0]"]');
if (col) {
  console.log("Found 1st column element in State 2 SVG:");
  console.log(new XMLSerializer().serializeToString(col));
} else {
  console.log("Could not find 1st column element in State 2 SVG!");
}
