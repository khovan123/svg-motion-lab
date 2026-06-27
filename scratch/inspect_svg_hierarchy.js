const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

manifest.states.forEach((state, sIdx) => {
  console.log(`\n=================== STATE ${sIdx} (${state.name}) HIERARCHY ===================`);
  const dom = new JSDOM(state.svg, { contentType: 'image/svg+xml' });
  const doc = dom.window.document;
  
  // Find all elements that look like columns. Let's find groups or rects around x=47, 72, 97, 122
  const cols = [47, 72, 97, 122];
  cols.forEach(xVal => {
    console.log(`\n--- Column at x = ${xVal} ---`);
    // Find any rect/path/g elements near this x coordinate
    doc.querySelectorAll('*').forEach(el => {
      const tag = el.tagName.toLowerCase();
      if (['rect', 'path', 'g'].includes(tag)) {
        const x = el.getAttribute('x');
        const fill = el.getAttribute('fill');
        const id = el.getAttribute('id') || el.getAttribute('data-motion-id') || '';
        
        let match = false;
        if (x === String(xVal)) match = true;
        if (tag === 'path' && el.getAttribute('d')) {
          const d = el.getAttribute('d');
          if (d.includes(`M${xVal} `) || d.includes(`M${xVal}.`) || d.includes(`H${xVal + 17}`)) match = true;
        }
        
        if (match) {
          console.log(`  <${tag}> id="${id}" fill="${fill}" x="${x}" y="${el.getAttribute('y')}" w="${el.getAttribute('width')}" h="${el.getAttribute('height')}"`);
          if (el.getAttribute('d')) {
            console.log(`    d: ${el.getAttribute('d').slice(0, 120)}`);
          }
          // Print parent tag and parent id/class
          if (el.parentNode) {
            console.log(`    Parent: <${el.parentNode.tagName}> id="${el.parentNode.id || ''}"`);
          }
        }
      }
    });
  });
});
