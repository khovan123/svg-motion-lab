const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgText = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svgText);
const doc = dom.window.document;

console.log('--- ALL SVG ELEMENTS ---');
const elements = doc.querySelectorAll('*');
console.log('Total elements:', elements.length);

const countsByTagName = {};
elements.forEach(el => {
  const tag = el.tagName.toLowerCase();
  countsByTagName[tag] = (countsByTagName[tag] || 0) + 1;
});
console.log('Counts by tag name:', countsByTagName);

console.log('\n--- Elements with data-motion-id or id attribute ---');
elements.forEach(el => {
  const id = el.id;
  const dmid = el.getAttribute('data-motion-id');
  if (id || dmid) {
    console.log(`<${el.tagName.toLowerCase()} id="${id || ''}" data-motion-id="${dmid || ''}" />`);
  }
});
