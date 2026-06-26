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

function getPathBounds(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let cx = 0, cy = 0;
  const update = (x, y) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (/^[a-zA-Z]$/.test(token)) {
      const cmd = token;
      i++;
      if (cmd === 'M' || cmd === 'L' || cmd === 'T') {
        cx = Number(tokens[i++]); cy = Number(tokens[i++]);
        update(cx, cy);
      } else if (cmd === 'm' || cmd === 'l' || cmd === 't') {
        cx += Number(tokens[i++]); cy += Number(tokens[i++]);
        update(cx, cy);
      } else if (cmd === 'H') {
        cx = Number(tokens[i++]);
        update(cx, cy);
      } else if (cmd === 'h') {
        cx += Number(tokens[i++]);
        update(cx, cy);
      } else if (cmd === 'V') {
        cy = Number(tokens[i++]);
        update(cx, cy);
      } else if (cmd === 'v') {
        cy += Number(tokens[i++]);
        update(cx, cy);
      } else if (cmd === 'C') {
        const x1 = Number(tokens[i++]), y1 = Number(tokens[i++]);
        const x2 = Number(tokens[i++]), y2 = Number(tokens[i++]);
        cx = Number(tokens[i++]); cy = Number(tokens[i++]);
        update(x1, y1); update(x2, y2); update(cx, cy);
      } else if (cmd === 'c') {
        const x1 = cx + Number(tokens[i++]), y1 = cy + Number(tokens[i++]);
        const x2 = cx + Number(tokens[i++]), y2 = cy + Number(tokens[i++]);
        cx += Number(tokens[i++]); cy += Number(tokens[i++]);
        update(x1, y1); update(x2, y2); update(cx, cy);
      } else if (cmd === 'S') {
        const x2 = Number(tokens[i++]), y2 = Number(tokens[i++]);
        cx = Number(tokens[i++]); cy = Number(tokens[i++]);
        update(x2, y2); update(cx, cy);
      } else if (cmd === 's') {
        const x2 = cx + Number(tokens[i++]), y2 = cy + Number(tokens[i++]);
        cx += Number(tokens[i++]); cy += Number(tokens[i++]);
        update(x2, y2); update(cx, cy);
      }
    } else {
      i++;
    }
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function getElementTransform(el) {
  let matrix = [1, 0, 0, 1, 0, 0];
  let current = el;
  const list = [];
  while (current && current.parentNode && current.tagName && current.tagName.toLowerCase() !== 'svg') {
    list.unshift(current);
    current = current.parentNode;
  }
  const multiply = (m1, m2) => [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
  ];
  list.forEach(node => {
    const tStr = node.getAttribute('transform');
    if (tStr) {
      const m = String(tStr).trim().match(/^matrix\(\s*([-+\deE.]+)[ ,]+([-+\deE.]+)[ ,]+([-+\deE.]+)[ ,]+([-+\deE.]+)[ ,]+([-+\deE.]+)[ ,]+([-+\deE.]+)\s*\)$/);
      if (m) matrix = multiply(matrix, m.slice(1).map(Number));
    }
  });
  return matrix;
}

function getAbsoluteBounds(el) {
  const tag = el.tagName.toLowerCase();
  let local = null;
  if (tag === 'path') {
    local = getPathBounds(el.getAttribute('d') || '');
  } else if (tag === 'g') {
    // get union of children bounds
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    el.querySelectorAll('path, rect').forEach(child => {
      const b = getAbsoluteBounds(child);
      if (b) {
        if (b.x < minX) minX = b.x;
        if (b.x + b.width > maxX) maxX = b.x + b.width;
        if (b.y < minY) minY = b.y;
        if (b.y + b.height > maxY) maxY = b.y + b.height;
      }
    });
    if (minX !== Infinity) {
      local = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      return local; // absolute already
    }
  }
  if (!local) return null;
  
  const m = getElementTransform(el);
  const corners = [
    [local.x, local.y],
    [local.x + local.width, local.y],
    [local.x, local.y + local.height],
    [local.x + local.width, local.y + local.height]
  ];
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  corners.forEach(([lx, ly]) => {
    const tx = m[0] * lx + m[2] * ly + m[4];
    const ty = m[1] * lx + m[3] * ly + m[5];
    if (tx < minX) minX = tx;
    if (tx > maxX) maxX = tx;
    if (ty < minY) minY = ty;
    if (ty > maxY) maxY = ty;
  });
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

const matchedNodes = new Map();
const matchedElementsSet = new Set();

const scene = rootSvg.querySelector('#motion-scene') || rootSvg;
const extractPath = (id) => {
  if (!id) return null;
  const split = id.indexOf(':@root');
  return split < 0 ? id : id.slice(split + 1);
};

const rootLayer = state.layers.find(l => extractPath(l.stableNodeId) === '@root');
if (rootLayer) {
  matchedNodes.set(rootLayer.stableNodeId, scene);
  matchedElementsSet.add(scene);
}

const containerLayers = state.layers.filter(l => ['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET'].includes(l.type) && l.stableNodeId !== rootLayer.stableNodeId);
const leafLayers = state.layers.filter(l => !['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET'].includes(l.type));

// First match leaf layers
leafLayers.forEach(layer => {
  let bestMatch = null;
  let minDiff = Infinity;
  svgElements.forEach(el => {
    if (matchedElementsSet.has(el)) return;
    if (el.tagName.toLowerCase() === 'g') return;
    
    const bSVG = getAbsoluteBounds(el);
    if (!bSVG) return;
    
    const bLayer = layer.bounds;
    const dx = Math.abs(bSVG.x - bLayer.x);
    const dy = Math.abs(bSVG.y - bLayer.y);
    const dw = Math.abs(bSVG.width - bLayer.width);
    const dh = Math.abs(bSVG.height - bLayer.height);
    const diff = dx + dy + dw + dh;
    
    if (dx < 2.5 && dy < 2.5 && dw < 2.5 && dh < 2.5) {
      if (diff < minDiff) {
        minDiff = diff;
        bestMatch = el;
      }
    }
  });
  if (bestMatch) {
    matchedNodes.set(layer.stableNodeId, bestMatch);
    matchedElementsSet.add(bestMatch);
  }
});

// Now match container layers
const sortedContainers = [...containerLayers].sort((a, b) => {
  return extractPath(b.stableNodeId).split('/').length - extractPath(a.stableNodeId).split('/').length;
});

sortedContainers.forEach(layer => {
  const children = state.layers.filter(l => l.parentStableNodeId === layer.stableNodeId);
  const matchedChildEls = children.map(c => matchedNodes.get(c.stableNodeId)).filter(Boolean);
  
  console.log(`\nContainer: ${layer.name} (${layer.stableNodeId})`);
  console.log(`  Matched children: ${matchedChildEls.length} / ${children.length}`);
  
  if (matchedChildEls.length > 0) {
    const firstChildEl = matchedChildEls[0];
    const candidates = [];
    let current = firstChildEl.parentNode;
    while (current && current.tagName && current.tagName.toLowerCase() !== 'svg') {
      if (current.tagName.toLowerCase() === 'g' && !matchedElementsSet.has(current)) {
        const containsAll = matchedChildEls.every(childEl => current.contains(childEl));
        if (containsAll) {
          candidates.push(current);
        }
      }
      current = current.parentNode;
    }
    
    console.log(`  Candidates:`, candidates.map(c => `<${c.tagName}> id="${c.id}" class="${c.className}"`));
    
    if (candidates.length > 0) {
      let bestMatch = candidates[0];
      let minDiff = Infinity;
      candidates.forEach(cand => {
        const bSVG = getAbsoluteBounds(cand);
        if (!bSVG) return;
        const bLayer = layer.bounds;
        const dx = Math.abs(bSVG.x - bLayer.x);
        const dy = Math.abs(bSVG.y - bLayer.y);
        const dw = Math.abs(bSVG.width - bLayer.width);
        const dh = Math.abs(bSVG.height - bLayer.height);
        const diff = dx + dy + dw + dh;
        console.log(`    Candidate diff = ${diff} (x=${bSVG.x}, y=${bSVG.y}, w=${bSVG.width}, h=${bSVG.height})`);
        if (diff < minDiff) {
          minDiff = diff;
          bestMatch = cand;
        }
      });
      matchedNodes.set(layer.stableNodeId, bestMatch);
      matchedElementsSet.add(bestMatch);
      console.log(`  BEST MATCH: <${bestMatch.tagName}> id="${bestMatch.id}"`);
    } else {
      console.log(`  NO CANDIDATE FOUND!`);
    }
  }
});
