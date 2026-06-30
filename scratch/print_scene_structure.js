const fs = require('fs');
const { JSDOM } = require('jsdom');

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svg);
const doc = dom.window.document;
const scene = doc.querySelector('#motion-scene');

function printTree(el, indent = '') {
  const mid = el.getAttribute('data-motion-id') || '';
  const tag = el.tagName.toLowerCase();
  const idAttr = el.getAttribute('id') || '';
  const classAttr = el.getAttribute('class') || '';
  const display = `${tag}${idAttr ? '#' + idAttr : ''}${classAttr ? '.' + classAttr : ''} ${mid ? '[data-motion-id="' + mid + '"]' : ''}`;
  console.log(indent + display);
  Array.from(el.children).forEach(child => printTree(child, indent + '  '));
}

if (scene) {
  printTree(scene);
} else {
  console.log('#motion-scene NOT FOUND!');
}
