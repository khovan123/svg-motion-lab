const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state16 = manifest.states[16];

// Look for mask-group-yellow etc. in raw SVG
const hasMaskGroupYellow = state16.svg.includes('mask-group-yellow');
const hasMaskGroupCyan = state16.svg.includes('mask-group-cyan');
console.log('State 16 SVG contains mask-group-yellow:', hasMaskGroupYellow);
console.log('State 16 SVG contains mask-group-cyan:', hasMaskGroupCyan);

// Let's look for ALL groups in the raw SVG
const dom = new JSDOM(state16.svg);
const doc = dom.window.document;
const groups = doc.querySelectorAll('g');
console.log('\nAll g elements (first 20):');
let count = 0;
groups.forEach(g => {
  if (count < 20) {
    console.log('  id=', g.getAttribute('id'), 'class=', g.getAttribute('class'), 'data-motion-id=', g.getAttribute('data-motion-id'), 'children=', g.children.length);
    count++;
  }
});
