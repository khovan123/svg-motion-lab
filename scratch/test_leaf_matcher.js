const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
const { window } = dom;
global.DOMParser = window.DOMParser;
global.XMLSerializer = window.XMLSerializer;

// Inline bounding box functions:
function parseTransform(value) {
  const text = String(value || '').trim();
  if (!text) return [1, 0, 0, 1, 0, 0];
  let m;
  if ((m = text.match(/^matrix\(\s*([-+\deE.]+)[ ,]+([-+\deE.]+)[ ,]+([-+\deE.]+)[ ,]+([-+\deE.]+)[ ,]+([-+\deE.]+)[ ,]+([-+\deE.]+)\s*\)$/))) return m.slice(1).map(Number);
  if ((m = text.match(/^translate\(\s*([-+\deE.]+)(?:[ ,]+([-+\deE.]+))?\s*\)$/))) return [1, 0, 0, 1, Number(m[1]), Number(m[2] || 0)];
  if ((m = text.match(/^scale\(\s*([-+\deE.]+)(?:[ ,]+([-+\deE.]+))?\s*\)$/))) {
    const x = Number(m[1]), y = Number(m[2] || m[1]);
    return [x, 0, 0, y, 0, 0];
  }
  return [1, 0, 0, 1, 0, 0];
}

function getElementTransform(el) {
  let matrix = [1, 0, 0, 1, 0, 0];
  let current = el;
  const list = [];
  while (current && current.tagName && current.tagName.toLowerCase() !== 'svg') {
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
      const m = parseTransform(tStr);
      if (m) matrix = multiply(matrix, m);
    }
  });
  return matrix;
}

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
      } else if (cmd === 'Q') {
        const x1 = Number(tokens[i++]), y1 = Number(tokens[i++]);
        cx = Number(tokens[i++]); cy = Number(tokens[i++]);
        update(x1, y1); update(cx, cy);
      } else if (cmd === 'q') {
        const x1 = cx + Number(tokens[i++]), y1 = cy + Number(tokens[i++]);
        cx += Number(tokens[i++]); cy += Number(tokens[i++]);
        update(x1, y1); update(cx, cy);
      } else if (cmd === 'A') {
        const rx = Number(tokens[i++]), ry = Number(tokens[i++]);
        const rot = Number(tokens[i++]), laf = Number(tokens[i++]), sf = Number(tokens[i++]);
        cx = Number(tokens[i++]); cy = Number(tokens[i++]);
        update(cx, cy);
      } else if (cmd === 'a') {
        const rx = Number(tokens[i++]), ry = Number(tokens[i++]);
        const rot = Number(tokens[i++]), laf = Number(tokens[i++]), sf = Number(tokens[i++]);
        cx += Number(tokens[i++]); cy += Number(tokens[i++]);
        update(cx, cy);
      }
    } else {
      i++;
    }
  }
  if (minX === Infinity) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function getAbsoluteBounds(el) {
  let local = null;
  const tag = el.tagName.toLowerCase();
  if (tag === 'rect') {
    local = {
      x: Number(el.getAttribute('x') || 0),
      y: Number(el.getAttribute('y') || 0),
      width: Number(el.getAttribute('width') || 0),
      height: Number(el.getAttribute('height') || 0)
    };
  } else if (tag === 'circle') {
    const cx = Number(el.getAttribute('cx') || 0);
    const cy = Number(el.getAttribute('cy') || 0);
    const r = Number(el.getAttribute('r') || 0);
    local = { x: cx - r, y: cy - r, width: 2*r, height: 2*r };
  } else if (tag === 'ellipse') {
    const cx = Number(el.getAttribute('cx') || 0);
    const cy = Number(el.getAttribute('cy') || 0);
    const rx = Number(el.getAttribute('rx') || 0);
    const ry = Number(el.getAttribute('ry') || 0);
    local = { x: cx - rx, y: cy - ry, width: 2*rx, height: 2*ry };
  } else if (tag === 'path') {
    local = getPathBounds(el.getAttribute('d') || '');
  } else if (tag === 'g') {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    Array.from(el.children).forEach(child => {
      if (['rect', 'circle', 'ellipse', 'path', 'g'].includes(child.tagName.toLowerCase())) {
        const cb = getAbsoluteBounds(child);
        if (cb) {
          if (cb.x < minX) minX = cb.x;
          if (cb.x + cb.width > maxX) maxX = cb.x + cb.width;
          if (cb.y < minY) minY = cb.y;
          if (cb.y + cb.height > maxY) maxY = cb.y + cb.height;
        }
      }
    });
    if (minX !== Infinity) {
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    return null;
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

function isTagCompatible(tag, type) {
  tag = tag.toLowerCase();
  if (type === 'RECTANGLE') return tag === 'rect' || tag === 'path';
  if (type === 'ELLIPSE') return tag === 'ellipse' || tag === 'circle' || tag === 'path';
  if (['VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'POLYGON'].includes(type)) return tag === 'path';
  if (type === 'TEXT') return tag === 'text' || tag === 'g';
  if (['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET'].includes(type)) return tag === 'g';
  return false;
}

function matchGeometryGlobally(state) {
  const doc = new DOMParser().parseFromString(state.svg, 'image/svg+xml');
  const rootSvg = doc.documentElement;
  
  // Collect all SVG elements that represent visual shapes
  const svgElements = [];
  const collect = (node) => {
    const tag = node.tagName.toLowerCase();
    if (['rect', 'circle', 'ellipse', 'path', 'text', 'g'].includes(tag)) {
      svgElements.push(node);
    }
    Array.from(node.children).forEach(collect);
  };
  collect(rootSvg);

  const matchedNodes = new Map();
  const matchedElementsSet = new Set();

  // First, map the @root layer to rootSvg
  const rootLayer = state.layers.find(l => l.stableNodeId.endsWith(':@root'));
  if (rootLayer) {
    matchedNodes.set(rootLayer.stableNodeId, rootSvg);
  }

  // Filter layers into:
  // 1. Group/Container layers
  // 2. Leaf shape layers
  const containerLayers = state.layers.filter(l => ['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET'].includes(l.type) && !l.stableNodeId.endsWith(':@root'));
  const leafLayers = state.layers.filter(l => !['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET'].includes(l.type));

  // Match leaf shape layers first, because their bounds are extremely accurate and unique!
  leafLayers.forEach(layer => {
    let bestMatch = null;
    let minDiff = Infinity;

    svgElements.forEach(el => {
      if (matchedElementsSet.has(el)) return;
      if (el.tagName.toLowerCase() === 'g') return; // Leaf layer shouldn't match <g>
      if (!isTagCompatible(el.tagName, layer.type)) return;

      const bSVG = getAbsoluteBounds(el);
      if (!bSVG) return;

      const bLayer = layer.bounds;
      const dx = Math.abs(bSVG.x - bLayer.x);
      const dy = Math.abs(bSVG.y - bLayer.y);
      const dw = Math.abs(bSVG.width - bLayer.width);
      const dh = Math.abs(bSVG.height - bLayer.height);

      const diff = dx + dy + dw + dh;
      // Allow a small tolerance (within 2 pixels)
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
      bestMatch.setAttribute('data-motion-id', layer.stableNodeId);
      console.log(`Matched Leaf "${layer.name}" (${layer.stableNodeId}) to <${bestMatch.tagName}>`);
    } else {
      console.log(`[Warning] Could not match Leaf "${layer.name}" (${layer.stableNodeId})`);
    }
  });

  // Match container/group layers next, using the matches of their children!
  // If a container contains a matched child, the container in the SVG DOM must be the ancestor of that child!
  containerLayers.forEach(layer => {
    // Find all child layers of this container
    const children = state.layers.filter(l => l.parentStableNodeId === layer.stableNodeId);
    
    // Find the first child that is already matched
    const matchedChild = children.find(c => matchedNodes.has(c.stableNodeId));
    if (matchedChild) {
      const childEl = matchedNodes.get(matchedChild.stableNodeId);
      // Walk up the DOM starting from childEl to find a <g> tag that represents the container
      let current = childEl.parentNode;
      while (current && current.tagName && current.tagName.toLowerCase() !== 'svg') {
        if (current.tagName.toLowerCase() === 'g' && !matchedElementsSet.has(current)) {
          // Found an unmatched <g> ancestor! Let's match it to the container
          matchedNodes.set(layer.stableNodeId, current);
          matchedElementsSet.add(current);
          current.setAttribute('data-motion-id', layer.stableNodeId);
          console.log(`Matched Container "${layer.name}" (${layer.stableNodeId}) to <g> via child`);
          break;
        }
        current = current.parentNode;
      }
    } else {
      // Fallback: match by bounds
      let bestMatch = null;
      let minDiff = Infinity;
      svgElements.forEach(el => {
        if (matchedElementsSet.has(el)) return;
        if (el.tagName.toLowerCase() !== 'g') return;
        
        const bSVG = getAbsoluteBounds(el);
        if (!bSVG) return;

        const bLayer = layer.bounds;
        const dx = Math.abs(bSVG.x - bLayer.x);
        const dy = Math.abs(bSVG.y - bLayer.y);
        const dw = Math.abs(bSVG.width - bLayer.width);
        const dh = Math.abs(bSVG.height - bLayer.height);

        const diff = dx + dy + dw + dh;
        if (dx < 3.5 && dy < 3.5 && dw < 3.5 && dh < 3.5) {
          if (diff < minDiff) {
            minDiff = diff;
            bestMatch = el;
          }
        }
      });

      if (bestMatch) {
        matchedNodes.set(layer.stableNodeId, bestMatch);
        matchedElementsSet.add(bestMatch);
        bestMatch.setAttribute('data-motion-id', layer.stableNodeId);
        console.log(`Matched Container "${layer.name}" (${layer.stableNodeId}) to <g> via bounds`);
      } else {
        console.log(`[Warning] Could not match Container "${layer.name}" (${layer.stableNodeId})`);
      }
    }
  });

  return new XMLSerializer().serializeToString(rootSvg);
}

console.log("Running Global Leaf Geometry Matcher on State 2...");
matchGeometryGlobally(manifest.states[2]);
