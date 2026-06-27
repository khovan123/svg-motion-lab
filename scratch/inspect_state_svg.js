const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const firstState = manifest.states[0];

console.log('State name:', firstState.name);
console.log('SVG length:', firstState.svg ? firstState.svg.length : 0);

if (firstState.svg) {
  const dom = new JSDOM(firstState.svg);
  const doc = dom.window.document;
  const elements = doc.querySelectorAll('*');
  console.log('Total elements in state SVG:', elements.length);
  const tags = {};
  elements.forEach(el => {
    const t = el.tagName.toLowerCase();
    tags[t] = (tags[t] || 0) + 1;
  });
  console.log('Tags count:', tags);

  // List elements with their data-glowing-id / data-motion-id / id / etc.
  elements.forEach(el => {
    const id = el.id;
    const mid = el.getAttribute('data-motion-id');
    const figmaid = el.getAttribute('data-figma-id');
    if (id || mid || figmaid || el.tagName.toLowerCase() === 'text' || el.tagName.toLowerCase() === 'rect') {
      console.log(`<${el.tagName.toLowerCase()} id="${id || ''}" data-motion-id="${mid || ''}" data-figma-id="${figmaid || ''}" />`);
    }
  });
}
