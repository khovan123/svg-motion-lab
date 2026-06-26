const fs = require('fs');
const { JSDOM } = require('jsdom');

// We can load the matching helper functions from web/semantic-15.js, or just write a small emulation
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state = manifest.states[0];

const dom = new JSDOM(state.svg);
const doc = dom.window.document;
const rootSvg = doc.documentElement;

// Convert rects to paths or get their bounds
function getAbsoluteBounds(el) {
  const tag = el.tagName.toLowerCase();
  if (tag === 'rect') {
    return {
      x: Number(el.getAttribute('x') || 0),
      y: Number(el.getAttribute('y') || 0),
      width: Number(el.getAttribute('width') || 0),
      height: Number(el.getAttribute('height') || 0)
    };
  }
  if (tag === 'path') {
    // Basic bounding box estimation from path commands
    const d = el.getAttribute('d') || '';
    const matches = d.match(/[+-]?\d*\.?\d+(?:e[+-]?\d+)?/g);
    if (!matches) return null;
    const nums = matches.map(Number);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < nums.length; i += 2) {
      if (i + 1 < nums.length) {
        const x = nums[i];
        const y = nums[i+1];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    if (minX === Infinity) return null;
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
  return null;
}

const leafLayers = state.layers.filter(l => !['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET'].includes(l.type));
const svgElements = [];
const collect = (node) => {
  const tag = node.tagName.toLowerCase();
  if (['rect', 'path', 'text'].includes(tag)) {
    svgElements.push(node);
  }
  Array.from(node.children).forEach(collect);
};
collect(rootSvg);

console.log('--- LEAF LAYERS TO MATCH ---');
leafLayers.forEach(l => {
  console.log(`Layer: ${l.name} (${l.type}) id=${l.id} stableNodeId=${l.stableNodeId}`);
  console.log(`  bounds: ${JSON.stringify(l.bounds)}`);
});

console.log('\n--- SVG ELEMENTS IN DOM ---');
svgElements.forEach((el, idx) => {
  const b = getAbsoluteBounds(el);
  console.log(`SVG Element ${idx}: tag=${el.tagName.toLowerCase()} bounds=${JSON.stringify(b)}`);
  // print first 50 chars of d if path
  if (el.tagName.toLowerCase() === 'path') {
    console.log(`  d: ${el.getAttribute('d').slice(0, 80)}...`);
  }
});
