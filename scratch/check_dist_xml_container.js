const fs = require('fs');
const { JSDOM } = require('jsdom');

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svg);
const doc = dom.window.document;
const el = doc.querySelector('[data-motion-id="1:4181:@root/container[0]"]');
console.log('Element in dist/animation.svg for 1:4181:@root/container[0]:', el ? el.outerHTML : 'NOT FOUND');

const els = doc.querySelectorAll('*');
console.log('All elements containing container[0] in data-motion-id:');
els.forEach(el => {
  const mid = el.getAttribute('data-motion-id');
  if (mid && mid.includes('container[0]')) {
    console.log('  ', el.tagName, 'mid =', mid);
  }
});
