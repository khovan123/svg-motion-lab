const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[0];
const dom = new JSDOM(state.svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

Array.from(doc.documentElement.children).forEach((child, idx) => {
  const d = child.getAttribute('d');
  console.log(`Child ${idx}: <${child.tagName}> data-motion-id="${child.getAttribute('data-motion-id')}" d = ${d ? '"' + d.slice(0, 30) + '..."' : 'null'}`);
  if (child.tagName.toLowerCase() === 'g') {
    // Check paths inside group
    child.querySelectorAll('path').forEach((p, pIdx) => {
      console.log(`  Path ${pIdx}: d = "${p.getAttribute('d') ? p.getAttribute('d').slice(0, 30) + '...' : ''}"`);
    });
  }
});
