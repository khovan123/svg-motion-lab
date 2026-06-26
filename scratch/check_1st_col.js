const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
const { window } = dom;
global.DOMParser = window.DOMParser;

manifest.states.forEach((state, sIdx) => {
  const doc = new DOMParser().parseFromString(state.svg, 'image/svg+xml');
  const found = doc.querySelector('[data-motion-id*="1st-column[0]/background"]');
  console.log(`State ${sIdx} (${state.name}): found? ${!!found} ID: ${found ? found.getAttribute('data-motion-id') : 'none'}`);
});
