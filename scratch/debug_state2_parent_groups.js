const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[2];
const dom = new JSDOM(state.svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

console.log("Groups in State 2 original SVG:");
doc.querySelectorAll('g').forEach((g, idx) => {
  const children = Array.from(g.children).map(c => `<${c.tagName}> x="${c.getAttribute('x') || ''}" y="${c.getAttribute('y') || ''}" fill="${c.getAttribute('fill') || ''}" d="${c.getAttribute('d') ? c.getAttribute('d').slice(0, 30) + '...' : ''}"`);
  console.log(`Index ${idx}: <g> children=[${children.join(', ')}]`);
});

console.log("\nActive path at x=72 parent chain:");
const activePath = Array.from(doc.querySelectorAll('path')).find(p => p.getAttribute('d') && p.getAttribute('d').includes('M72 '));
if (activePath) {
  let curr = activePath;
  while (curr) {
    console.log(`  -> <${curr.tagName}> id="${curr.id || ''}"`);
    curr = curr.parentNode;
  }
}
