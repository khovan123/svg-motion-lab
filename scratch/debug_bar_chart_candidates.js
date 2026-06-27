const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[0];
const dom = new JSDOM(state.svg, { contentType: 'image/svg+xml' });
const rootSvg = dom.window.document.documentElement;

// Convert rects to paths
function convertRectToPath(rect) {
  const x = Number(rect.getAttribute('x') || 0);
  const y = Number(rect.getAttribute('y') || 0);
  const w = Number(rect.getAttribute('width') || 0);
  const h = Number(rect.getAttribute('height') || 0);
  const rx = Number(rect.getAttribute('rx') || rect.getAttribute('ry') || 0);
  const ry = Number(rect.getAttribute('ry') || rect.getAttribute('rx') || 0);
  const path = rect.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'path');
  for (const attr of rect.getAttributeNames()) {
    if (!['x', 'y', 'width', 'height', 'rx', 'ry'].includes(attr)) {
      path.setAttribute(attr, rect.getAttribute(attr));
    }
  }
  const k = 0.55228474983;
  const d = `M${x} ${y + ry}C${x} ${y + ry - ry * k} ${x + rx - rx * k} ${y} ${x + rx} ${y}H${x + w - rx}C${x + w - rx + rx * k} ${y} ${x + w} ${y + ry - ry * k} ${x + w} ${y + ry}V${y + h - ry}C${x + w} ${y + h - ry + ry * k} ${x + w - rx + rx * k} ${y + h} ${x + w - rx} ${y + h}H${x + rx}C${x + rx - rx * k} ${y + h} ${x} ${y + h - ry + ry * k} ${x} ${y + h - ry}V${y + ry}Z`;
  path.setAttribute('d', d);
  rect.parentNode.replaceChild(path, rect);
}

rootSvg.querySelectorAll('rect').forEach(rect => {
  let parent = rect.parentNode;
  let isInsideDefs = false;
  while (parent) {
    if (parent.tagName && parent.tagName.toLowerCase() === 'defs') {
      isInsideDefs = true;
      break;
    }
    parent = parent.parentNode;
  }
  if (!isInsideDefs) {
    convertRectToPath(rect);
  }
});

const svgElements = [];
const collect = (node) => {
  if (['path', 'rect', 'g'].includes(node.tagName.toLowerCase())) {
    svgElements.push(node);
  }
  Array.from(node.children).forEach(collect);
};
collect(rootSvg);

const matchedNodes = new Map();
const matchedElementsSet = new Set();

const scene = rootSvg.querySelector('#motion-scene') || rootSvg;
matchedNodes.set('1:4181:@root', scene);
matchedElementsSet.add(scene);

// Match leaf layers manually for test
const leafLayers = state.layers.filter(l => !['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET'].includes(l.type));
leafLayers.forEach(layer => {
  let bestMatch = null;
  let minDiff = Infinity;
  svgElements.forEach(el => {
    if (matchedElementsSet.has(el)) return;
    if (el.tagName.toLowerCase() === 'g') return;
    const x = Number(el.getAttribute('x') || 0);
    // basic match
    if (layer.bounds && Math.abs(x - layer.bounds.x) < 2) {
      bestMatch = el;
    }
  });
  if (bestMatch) {
    matchedNodes.set(layer.stableNodeId, bestMatch);
    matchedElementsSet.add(bestMatch);
  }
});

// Mock matched columns
const colIds = [
  '1:4181:@root/bar-chart[0]/4th-column[0]',
  '1:4181:@root/bar-chart[0]/3rd-column[0]',
  '1:4181:@root/bar-chart[0]/2nd-column[0]',
  '1:4181:@root/bar-chart[0]/1st-column[0]'
];

// Let's find direct parents of the columns in SVG
svgElements.forEach(el => {
  if (el.tagName.toLowerCase() === 'path') {
    const d = el.getAttribute('d') || '';
    colIds.forEach(id => {
      if (id.includes('4th') && d.includes('M122 ')) matchedNodes.set(id, el.parentNode);
      if (id.includes('3rd') && d.includes('M97 ')) matchedNodes.set(id, el.parentNode);
      if (id.includes('2nd') && d.includes('M72 ')) matchedNodes.set(id, el.parentNode);
      if (id.includes('1st') && d.includes('M47 ')) matchedNodes.set(id, el.parentNode);
    });
  }
});

colIds.forEach(id => {
  const node = matchedNodes.get(id);
  if (node) matchedElementsSet.add(node);
});

// Now debug Bar Chart matching
const barChartLayer = state.layers.find(l => l.stableNodeId === '1:4181:@root/bar-chart[0]');
const children = state.layers.filter(l => l.parentStableNodeId === barChartLayer.stableNodeId);
const matchedChildEls = children.map(c => matchedNodes.get(c.stableNodeId)).filter(Boolean);

console.log(`bar-chart children count:`, children.length);
console.log(`matched children count:`, matchedChildEls.length);

const firstChildEl = matchedChildEls[0];
let current = firstChildEl.parentNode;
while (current) {
  console.log(`\nParent node: <${current.tagName}> id="${current.id}" class="${current.className}"`);
  console.log(`  is g? ${current.tagName.toLowerCase() === 'g'}`);
  console.log(`  already matched? ${matchedElementsSet.has(current)}`);
  if (current.tagName.toLowerCase() === 'g') {
    const containsAll = matchedChildEls.every((childEl, index) => {
      const contains = current.contains(childEl);
      console.log(`    contains child ${index} (${children[index].stableNodeId}): ${contains}`);
      return contains;
    });
    console.log(`  containsAll = ${containsAll}`);
  }
  current = current.parentNode;
}
