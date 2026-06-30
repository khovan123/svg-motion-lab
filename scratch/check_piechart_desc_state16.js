const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state16 = manifest.states[16];

const dom = new JSDOM(state16.svg);
const doc = dom.window.document;
const piechart = doc.querySelector('[data-motion-id="1:4181:@root/piechart[0]"]');
if (piechart) {
  console.log('Piechart children:');
  Array.from(piechart.children).forEach(child => {
    console.log('  tagName=', child.tagName, 'data-motion-id=', child.getAttribute('data-motion-id'), 'id=', child.getAttribute('id'), 'children=', child.children.length);
  });
  console.log('\nAll descendants with data-motion-id:');
  piechart.querySelectorAll('[data-motion-id]').forEach(el => {
    console.log('  ', el.tagName, el.getAttribute('data-motion-id'));
  });
}
