const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state0 = manifest.states[0];
const dom = new JSDOM(state0.svg);
const doc = dom.window.document;

// Check all elements inside 1st-column
const col1 = doc.querySelector('[data-motion-id="1:4181:@root/bar-chart[0]/1st-column[0]"]');
if (col1) {
  console.log('1st-column tags:');
  col1.querySelectorAll('*').forEach(el => {
    const mid = el.getAttribute('data-motion-id') || '';
    console.log('  ', el.tagName, 'mid:', mid, 'd:', el.getAttribute('d') ? el.getAttribute('d').slice(0, 40) : '');
  });
} else {
  console.log('1st-column not found');
}

// Also check the raw structure for piechart
const piechart = doc.querySelector('[data-motion-id="1:4181:@root/piechart[0]"]');
if (piechart) {
  console.log('\npiechart tags:');
  Array.from(piechart.children).forEach(el => {
    const mid = el.getAttribute('data-motion-id') || '';
    console.log('  ', el.tagName, 'mid:', mid, 'children:', el.children.length);
    Array.from(el.children).slice(0, 3).forEach(child => {
      const cmid = child.getAttribute('data-motion-id') || '';
      console.log('    ', child.tagName, 'mid:', cmid, 'd:', child.getAttribute('d') ? child.getAttribute('d').slice(0, 40) : '');
    });
  });
}
