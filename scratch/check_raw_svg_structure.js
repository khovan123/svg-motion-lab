const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state0 = manifest.states[0];
const dom = new JSDOM(state0.svg);
const doc = dom.window.document;

const barchart = doc.querySelector('[data-motion-id*="bar-chart"]');
if (barchart) {
  console.log('bar-chart element:', barchart.tagName, barchart.getAttribute('data-motion-id'));
  console.log('Children of bar-chart:');
  Array.from(barchart.querySelectorAll('*')).slice(0, 30).forEach(el => {
    const mid = el.getAttribute('data-motion-id') || '';
    if (mid) console.log('  ', el.tagName, mid);
  });
}

console.log('\nParents of mask-group[0]:');
const mg0 = doc.querySelector('[data-motion-id*="mask-group[0]"]');
if (mg0) {
  let el = mg0;
  while (el) {
    const mid = el.getAttribute ? el.getAttribute('data-motion-id') : '[document]';
    console.log('  ', el.tagName || '[document]', mid || '(no id)');
    el = el.parentNode;
  }
}
