const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state0 = manifest.states[0];

const dom = new JSDOM(state0.svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

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
    // Basic path bounds parser
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
  
  if (tag === 'g') {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    Array.from(el.children).forEach(child => {
      const cb = getAbsoluteBounds(child);
      if (cb) {
        if (cb.x < minX) minX = cb.x;
        if (cb.x + cb.width > maxX) maxX = cb.x + cb.width;
        if (cb.y < minY) minY = cb.y;
        if (cb.y + cb.height > maxY) maxY = cb.y + cb.height;
      }
    });
    if (minX !== Infinity) return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    return null;
  }
  return local;
}

console.log("All <g> elements in State 0 original SVG:");
doc.querySelectorAll('g').forEach((g, idx) => {
  const b = getAbsoluteBounds(g);
  let clipPath = g.getAttribute('clip-path') || '';
  let filter = g.getAttribute('filter') || '';
  let mask = g.getAttribute('mask') || '';
  console.log(`G[${idx}]: bounds=${JSON.stringify(b)}, clipPath=${clipPath}, filter=${filter}, mask=${mask}`);
  console.log(`   HTML: ${g.outerHTML.slice(0, 160)}`);
});
