const fs = require('fs');
const { JSDOM } = require('jsdom');

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

const allElements = doc.querySelectorAll('[data-motion-id]');
allElements.forEach(el => {
  const id = el.getAttribute('data-motion-id');
  if (id.includes('vector-stroke')) {
    let parent = el.parentNode;
    console.log(`  ID: ${id}`);
    console.log(`    Parent tag: ${parent ? parent.tagName.toLowerCase() : 'none'}`);
    console.log(`    Parent outerHTML: ${parent ? parent.outerHTML.slice(0, 300) : 'none'}`);
  }
});
