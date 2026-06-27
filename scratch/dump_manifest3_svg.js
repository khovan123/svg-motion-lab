const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest3.json', 'utf8'));

manifest.states.forEach((state, stateIdx) => {
  console.log(`\n================ State ${stateIdx}: ${state.name} ================`);
  const doc = new JSDOM(state.svg, { contentType: 'image/svg+xml' }).window.document;
  
  // Print all top-level elements or groups
  const printElement = (el, indent = '') => {
    let tag = el.tagName.toLowerCase();
    let attrs = '';
    Array.from(el.attributes).forEach(attr => {
      if (['id', 'data-motion-id', 'transform', 'fill', 'stroke', 'd'].includes(attr.name)) {
        let val = attr.value;
        if (attr.name === 'd') {
          val = val.substring(0, 30) + '...';
        }
        attrs += ` ${attr.name}="${val}"`;
      }
    });
    console.log(`${indent}<${tag}${attrs}>${el.textContent ? ` ${el.textContent.trim().substring(0, 20)}` : ''}`);
    Array.from(el.children).forEach(child => {
      printElement(child, indent + '  ');
    });
  };

  const svg = doc.querySelector('svg');
  if (svg) {
    printElement(svg);
  }
});
