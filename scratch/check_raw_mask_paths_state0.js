const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state0 = manifest.states[0];
const dom = new JSDOM(state0.svg);
const doc = dom.window.document;

const masks = doc.querySelectorAll('mask');
console.log('Masks in state 0 raw SVG:');
masks.forEach(m => {
  console.log('  mask id:', m.getAttribute('id'));
  m.querySelectorAll('path').forEach(p => {
    console.log('    path d:', p.getAttribute('d'));
  });
});
