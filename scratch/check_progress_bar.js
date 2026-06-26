const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

manifest.states.forEach((state, stateIdx) => {
  console.log(`\nState ${stateIdx} (${state.name}):`);
  const doc = new (require('jsdom').JSDOM)(state.svg).window.document;
  
  // Find all elements
  const elements = doc.querySelectorAll('[data-motion-id]');
  elements.forEach(el => {
    const id = el.getAttribute('data-motion-id');
    if (id.includes('active') || id.includes('bar') || id.includes('progress') || id.includes('background')) {
      console.log(`  Element: ${el.tagName}, id: ${id}`);
      // print attributes like x, y, width, height, rx, ry, fill
      const attrs = ['x', 'y', 'width', 'height', 'rx', 'ry', 'fill', 'opacity'];
      attrs.forEach(attr => {
        if (el.hasAttribute(attr)) {
          console.log(`    ${attr}: ${el.getAttribute(attr)}`);
        }
      });
    }
  });
});
