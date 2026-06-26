const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[0];
const dom = new JSDOM(state.svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

console.log("State 0 Top-level children of <svg>:");
Array.from(doc.documentElement.children).forEach((child, idx) => {
  console.log(`Child ${idx}: <${child.tagName}> id="${child.getAttribute('id') || ''}" data-motion-id="${child.getAttribute('data-motion-id') || ''}" class="${child.getAttribute('class') || ''}"`);
});
