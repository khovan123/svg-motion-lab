const fs = require('fs');
const { JSDOM } = require('jsdom');

const svg = fs.readFileSync('verify-z-c1/animation.svg', 'utf8');
const dom = new JSDOM(svg);
const doc = dom.window.document;

const all = doc.querySelectorAll('[data-motion-id]');
all.forEach(el => {
  const mid = el.getAttribute('data-motion-id') || '';
  if (mid.includes('mask-group_')) {
    let path = [];
    let curr = el;
    while (curr) {
      if (curr.tagName) {
        const tag = curr.tagName.toLowerCase();
        const idAttr = curr.getAttribute('id') ? '#' + curr.getAttribute('id') : '';
        path.unshift(tag + idAttr);
      } else {
        path.unshift('[document]');
      }
      curr = curr.parentNode;
    }
    console.log('mid:', mid, 'path:', path.join(' > '));
  }
});
