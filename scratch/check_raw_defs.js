const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state0 = manifest.states[0];
const dom = new JSDOM(state0.svg);
const doc = dom.window.document;

const defs = doc.querySelector('defs');
console.log('data-motion-id inside raw defs of state 0:');
if (defs) {
  defs.querySelectorAll('[data-motion-id]').forEach(el => {
    console.log('  ', el.tagName, el.getAttribute('data-motion-id'));
  });
} else {
  console.log('No defs found');
}
