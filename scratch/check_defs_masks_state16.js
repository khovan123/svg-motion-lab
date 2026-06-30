const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state16 = manifest.states[16];
const dom = new JSDOM(state16.svg);
const doc = dom.window.document;

const defs = doc.querySelector('defs');
console.log('Masks inside defs in state 16 raw SVG:');
if (defs) {
  defs.querySelectorAll('mask').forEach(m => {
    console.log('  mask id:', m.getAttribute('id'));
  });
} else {
  console.log('No defs found');
}

console.log('\nMasks outside defs in state 16 raw SVG:');
doc.querySelectorAll('svg > mask').forEach(m => {
  console.log('  mask id:', m.getAttribute('id'));
});
