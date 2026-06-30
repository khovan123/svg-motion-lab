const fs = require('fs');
const { JSDOM } = require('jsdom');

const verifySvg = fs.readFileSync('verify-z-c1/animation.svg', 'utf8');
const dom = new JSDOM(verifySvg);
const doc = dom.window.document;

// Find piechart mask groups
const maskGroups = doc.querySelectorAll('[data-motion-id*="mask-group"]');
console.log('mask-group elements in verify:');
maskGroups.forEach(el => {
  const mid = el.getAttribute('data-motion-id');
  console.log('  ', el.tagName, mid, 'parent:', el.parentNode && el.parentNode.getAttribute('data-motion-id'));
});
