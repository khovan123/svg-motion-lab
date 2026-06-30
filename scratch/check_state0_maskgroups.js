const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state0 = manifest.states[0];
const dom = new JSDOM(state0.svg);
const doc = dom.window.document;

// Find all elements with data-motion-id containing mask-group
const all = doc.querySelectorAll('[data-motion-id*="mask-group"]');
all.forEach(el => {
  console.log(el.tagName, '  mid:', el.getAttribute('data-motion-id'));
});
