const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[3];
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

// Let's get bounds helper
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

function getAbsoluteBounds(el) {
  if (el.tagName.toLowerCase() === 'path') {
    return getPathBounds(el.getAttribute('d') || '');
  }
  return null;
}

// Check column 2 layers: background and active
const bgLayer = state.layers.find(l => l.stableNodeId.includes('2nd-column[0]/background[0]'));
const actLayer = state.layers.find(l => l.stableNodeId.includes('2nd-column[0]/active[0]'));

console.log('Background layer bounds:', bgLayer.bounds);
console.log('Active layer bounds:', actLayer.bounds);

// Print all candidate elements at x=72 in SVG
console.log('\nCandidates in SVG:');
svgElements.forEach((el, idx) => {
  if (el.tagName.toLowerCase() !== 'path') return;
  const b = getAbsoluteBounds(el);
  if (b && Math.abs(b.x - 72) < 2) {
    console.log(`Element index ${idx}: fill="${el.getAttribute('fill')}" bounds:`, b);
    
    // Calculate differences for bgLayer
    const bgDiff = Math.abs(b.x - bgLayer.bounds.x) + Math.abs(b.y - bgLayer.bounds.y) + Math.abs(b.width - bgLayer.bounds.width) + Math.abs(b.height - bgLayer.bounds.height);
    // Calculate differences for actLayer
    const actDiff = Math.abs(b.x - actLayer.bounds.x) + Math.abs(b.y - actLayer.bounds.y) + Math.abs(b.width - actLayer.bounds.width) + Math.abs(b.height - actLayer.bounds.height);
    
    console.log(`  bgDiff = ${bgDiff}, actDiff = ${actDiff}`);
  }
});
