const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[0];
const dom = new JSDOM(state.svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

const paths = doc.querySelectorAll('rect, path');
paths.forEach(el => {
  const x = el.getAttribute('x');
  if (['47', '72', '97', '122'].includes(x)) {
    console.log(`\nElement: <${el.tagName}> x="${x}" fill="${el.getAttribute('fill')}"`);
    let p = el.parentNode;
    while (p) {
      console.log(`  -> <${p.tagName}> id="${p.id || ''}" class="${p.className || ''}"`);
      p = p.parentNode;
    }
  }
});
