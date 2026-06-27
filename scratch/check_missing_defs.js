const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const parser = new window.DOMParser();

manifest.states.forEach((state, sIdx) => {
  const doc = parser.parseFromString(state.svg, 'image/svg+xml');
  const root = doc.documentElement;
  
  // Find all defined IDs
  const definedIds = new Set();
  root.querySelectorAll('[id]').forEach(el => definedIds.add(el.getAttribute('id')));
  
  // Find all referenced IDs
  const referencedIds = new Set();
  root.querySelectorAll('*').forEach(el => {
    ['fill', 'stroke', 'filter', 'clip-path', 'mask'].forEach(attr => {
      if (el.hasAttribute(attr)) {
        const val = el.getAttribute(attr);
        const match = val.match(/url\(#(.*?)\)/);
        if (match) referencedIds.add(match[1]);
      }
    });
    ['href', 'xlink:href'].forEach(attr => {
      if (el.hasAttribute(attr)) {
        const val = el.getAttribute(attr);
        if (val.startsWith('#')) referencedIds.add(val.slice(1));
      }
    });
  });
  
  // Check for missing definitions
  const missing = [...referencedIds].filter(id => !definedIds.has(id));
  if (missing.length > 0) {
    console.log(`State ${sIdx} (${state.name}) has referenced IDs not defined in its SVG:`, missing);
  }
});
