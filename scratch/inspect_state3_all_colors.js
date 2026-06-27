const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[3];
const dom = new JSDOM(state.svg, { contentType: 'image/svg+xml' });

console.log(`All rect/path elements in State 3 SVG:`);
dom.window.document.querySelectorAll('rect, path').forEach((el, idx) => {
  const fill = el.getAttribute('fill');
  const d = el.getAttribute('d');
  const x = el.getAttribute('x') || '';
  const y = el.getAttribute('y') || '';
  const w = el.getAttribute('width') || '';
  const h = el.getAttribute('height') || '';
  console.log(`Index ${idx}: <${el.tagName}> fill="${fill}" x="${x}" y="${y}" w="${w}" h="${h}" d="${d ? d.slice(0, 40) + '...' : ''}"`);
});
