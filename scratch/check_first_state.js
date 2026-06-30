const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

// Which state is first? (1:4218)
const firstState = manifest.states.find(s => s.id === '1:4218');
if (!firstState) {
  console.log('State 1:4218 not found');
  process.exit(1);
}

console.log('First state:', firstState.name, firstState.id);
const dom = new JSDOM(firstState.svg);
const doc = dom.window.document;
const maskGroups = doc.querySelectorAll('[data-motion-id*="mask-group"]');
console.log('mask-group elements in first state SVG:');
maskGroups.forEach(el => console.log('  ', el.tagName, el.getAttribute('data-motion-id')));
