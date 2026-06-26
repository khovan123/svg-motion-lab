const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[0];
const dom = new (require('jsdom').JSDOM)(state.svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

console.log("Raw elements in State 0 SVG:");
const elements = [];
const collect = (node) => {
  if (node.tagName && ['rect', 'circle', 'ellipse', 'path', 'g'].includes(node.tagName.toLowerCase())) {
    elements.push(node);
  }
  Array.from(node.children).forEach(collect);
};
collect(doc.documentElement);

elements.forEach((el, idx) => {
  const outer = el.outerHTML.split('>')[0] + '>';
  console.log(`[${idx}] ${outer}`);
});
