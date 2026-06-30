const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state16 = manifest.states[16];

const dom = new JSDOM(state16.svg);
const doc = dom.window.document;

// Print all groups containing mask-group
const piechart = doc.querySelector('[data-motion-id="1:4181:@root/piechart[0]"]');
if (!piechart) {
  console.log('No piechart found in state 16');
} else {
  console.log('Piechart children in state 16:');
  Array.from(piechart.children).forEach(child => {
    const mid = child.getAttribute('data-motion-id') || '';
    console.log('  ', child.tagName, 'mid=', mid, 'class=', child.getAttribute('class'));
  });
}
