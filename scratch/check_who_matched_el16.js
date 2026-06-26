const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state0 = manifest.states[0];

const dom = new JSDOM(state0.svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

// We will replicate matchGeometryGloballyV2 exactly but add prints for Element [16]
const rootSvg = doc.documentElement;
rootSvg.querySelectorAll('[data-motion-id]').forEach(el => el.removeAttribute('data-motion-id'));

const matchedNodes = new Map();
const scene = rootSvg.querySelector('#motion-scene') || rootSvg;
const extractPath = (id) => {
  if (!id) return null;
  const split = id.indexOf(':@root');
  return split < 0 ? id : id.slice(split + 1);
};

const rootLayer = state0.layers.find(l => extractPath(l.stableNodeId) === '@root');
if (rootLayer) {
  matchedNodes.set(rootLayer.stableNodeId, scene);
}

const containerLayers = state0.layers.filter(l => ['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET'].includes(l.type) && l.stableNodeId !== rootLayer.stableNodeId);
const leafLayers = state0.layers.filter(l => !['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET'].includes(l.type));

const svgElements = [];
const collect = (node) => {
  const tag = node.tagName.toLowerCase();
  if (['rect', 'circle', 'ellipse', 'path', 'text', 'g'].includes(tag)) {
    svgElements.push(node);
  }
  Array.from(node.children).forEach(collect);
};
collect(rootSvg);

const matchedElementsSet = new Set();
matchedElementsSet.add(scene);

// Let's identify the index of the path M196 59 in svgElements
const el16Idx = svgElements.findIndex(el => el.getAttribute('d')?.includes('M196 59'));
console.log(`Element index for M196 59: ${el16Idx}`);

function isTagCompatible(tag, type) {
  tag = tag.toLowerCase();
  if (type === 'RECTANGLE') return tag === 'rect' || tag === 'path';
  if (type === 'ELLIPSE') return tag === 'ellipse' || tag === 'circle' || tag === 'path';
  if (['VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'POLYGON'].includes(type)) return tag === 'path';
  if (type === 'TEXT') return tag === 'text' || tag === 'g';
  if (['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET'].includes(type)) return tag === 'g';
  return false;
}

function getAbsoluteBounds(el) {
  // basic bounds logic as before
  let local = null;
  const tag = el.tagName.toLowerCase();
  if (tag === 'rect') {
    local = {
      x: Number(el.getAttribute('x') || 0),
      y: Number(el.getAttribute('y') || 0),
      width: Number(el.getAttribute('width') || 0),
      height: Number(el.getAttribute('height') || 0)
    };
  } else if (tag === 'path') {
    const tokens = el.getAttribute('d')?.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let i = 0;
    while (i < tokens.length) {
      if (/^[a-zA-Z]$/.test(tokens[i])) { i++; }
      else {
        const x = Number(tokens[i++]);
        const y = Number(tokens[i++]);
        if (!isNaN(x) && !isNaN(y)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (minX !== Infinity) local = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
  return local;
}

leafLayers.forEach(layer => {
  let bestMatch = null;
  let minDiff = Infinity;

  svgElements.forEach((el, elIdx) => {
    if (matchedElementsSet.has(el)) return;
    if (el.tagName.toLowerCase() === 'g') return;
    if (!isTagCompatible(el.tagName, layer.type)) return;

    const bSVG = getAbsoluteBounds(el);
    if (!bSVG) return;

    const bLayer = layer.bounds;
    const dx = Math.abs(bSVG.x - bLayer.x);
    const dy = Math.abs(bSVG.y - bLayer.y);
    const dw = Math.abs(bSVG.width - bLayer.width);
    const dh = Math.abs(bSVG.height - bLayer.height);

    const diff = dx + dy + dw + dh;
    const boundsMatch = dx < 2.5 && dy < 2.5 && dw < 2.5 && dh < 2.5;

    const isInside = bSVG.x >= bLayer.x - 3.5 && 
                     bSVG.y >= bLayer.y - 3.5 && 
                     bSVG.x + bSVG.width <= bLayer.x + bLayer.width + 3.5 && 
                     bSVG.y + bSVG.height <= bLayer.y + bLayer.height + 3.5;

    if (boundsMatch || (isInside && (layer.name.toLowerCase().includes('yellow') || layer.name.toLowerCase().includes('cyan') || layer.name.toLowerCase().includes('blue') || layer.name.toLowerCase().includes('orange') || layer.type === 'ELLIPSE'))) {
      if (diff < minDiff) {
        minDiff = diff;
        bestMatch = el;
      }
    }
  });

  if (bestMatch) {
    const matchedIdx = svgElements.indexOf(bestMatch);
    if (matchedIdx === el16Idx) {
      console.log(`>>> Element [16] is matched to layer: Name=${layer.name}, stableNodeId=${layer.stableNodeId}`);
    }
    matchedNodes.set(layer.stableNodeId, bestMatch);
    matchedElementsSet.add(bestMatch);
  }
});

if (!matchedElementsSet.has(svgElements[el16Idx])) {
  console.log(">>> Element [16] was NOT matched by any layer!");
}
