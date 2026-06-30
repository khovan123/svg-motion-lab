const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  runScripts: 'dangerously'
});
const { window } = dom;
if (!window.CSS) window.CSS = {};
if (!window.CSS.escape) {
  window.CSS.escape = function (value) {
    return String(value).replace(/([^\w-])/g, '\\$1');
  };
}

const state = manifest.states[0];
const doc = new window.DOMParser().parseFromString(state.svg, 'image/svg+xml');
const rootSvg = doc.documentElement;
const originalIds = new Set();
rootSvg.querySelectorAll('[data-motion-id]').forEach(el => {
  originalIds.add(el.getAttribute('data-motion-id'));
});

console.log('Original IDs in state 0 containing container[0]:');
for (const id of originalIds) {
  if (id.includes('container[0]')) {
    console.log('  ', id);
  }
}
