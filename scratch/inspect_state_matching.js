const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

// We want to investigate State 2
const state = manifest.states[2];
console.log(`State 2 name: ${state.name}, id: ${state.id}`);

console.log("\nLayers in manifest for State 2 (bar-chart active):");
state.layers.forEach(l => {
  if (l.name.includes('Active') && l.stableNodeId.includes('bar-chart')) {
    console.log(`  Name: ${l.name}, stableNodeId: ${l.stableNodeId}, Bounds: ${JSON.stringify(l.bounds)}`);
  }
});

const dom = new JSDOM(state.svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;
const svgNodeMap = [];
const collect = (node) => {
  if (node.tagName && ['rect', 'circle', 'ellipse', 'path', 'text', 'g'].includes(node.tagName.toLowerCase())) {
    const motionId = node.getAttribute('data-motion-id');
    const transform = node.getAttribute('transform');
    const x = node.getAttribute('x');
    const y = node.getAttribute('y');
    const w = node.getAttribute('width');
    const h = node.getAttribute('height');
    const d = node.getAttribute('d');
    
    // We only care about rect elements under bar-chart
    svgNodeMap.push({
      tag: node.tagName.toLowerCase(),
      motionId,
      x, y, w, h, d,
      transform
    });
  }
  Array.from(node.children).forEach(collect);
};
collect(doc.documentElement);

console.log("\nSVG elements in State 2 SVG:");
svgNodeMap.forEach((entry, idx) => {
  console.log(`  [${idx}] Tag: ${entry.tag}, motionId: ${entry.motionId}, bounds: x=${entry.x} y=${entry.y} w=${entry.w} h=${entry.h} d=${entry.d ? entry.d.slice(0, 30) : null}, transform: ${entry.transform}`);
});
