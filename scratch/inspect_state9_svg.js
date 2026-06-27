const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state = manifest.states[9]; // State 9 is "Property 1=10"

console.log('State name:', state.name);

const dom = new JSDOM(state.svg);
const doc = dom.window.document;
const rootSvg = doc.documentElement;

// Function to compute bounds
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
    const d = el.getAttribute('d') || '';
    const matches = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
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
    while (i < matches.length) {
      const token = matches[i];
      if (/^[a-zA-Z]$/.test(token)) {
        const cmd = token;
        i++;
        if (cmd === 'M' || cmd === 'L' || cmd === 'T') {
          cx = Number(matches[i++]); cy = Number(matches[i++]);
          update(cx, cy);
        } else if (cmd === 'm' || cmd === 'l' || cmd === 't') {
          cx += Number(matches[i++]); cy += Number(matches[i++]);
          update(cx, cy);
        } else if (cmd === 'H') {
          cx = Number(matches[i++]);
          update(cx, cy);
        } else if (cmd === 'h') {
          cx += Number(matches[i++]);
          update(cx, cy);
        } else if (cmd === 'V') {
          cy = Number(matches[i++]);
          update(cx, cy);
        } else if (cmd === 'v') {
          cy += Number(matches[i++]);
          update(cx, cy);
        } else if (cmd === 'C') {
          const x1 = Number(matches[i++]), y1 = Number(matches[i++]);
          const x2 = Number(matches[i++]), y2 = Number(matches[i++]);
          cx = Number(matches[i++]); cy = Number(matches[i++]);
          update(x1, y1); update(x2, y2); update(cx, cy);
        } else if (cmd === 'c') {
          const x1 = cx + Number(matches[i++]), y1 = cy + Number(matches[i++]);
          const x2 = cx + Number(matches[i++]), y2 = cy + Number(matches[i++]);
          cx += Number(matches[i++]); cy += Number(matches[i++]);
          update(x1, y1); update(x2, y2); update(cx, cy);
        } else if (cmd === 'S') {
          const x2 = Number(matches[i++]), y2 = Number(matches[i++]);
          cx = Number(matches[i++]); cy = Number(matches[i++]);
          update(x2, y2); update(cx, cy);
        } else if (cmd === 's') {
          const x2 = cx + Number(matches[i++]), y2 = cy + Number(matches[i++]);
          cx += Number(matches[i++]); cy += Number(matches[i++]);
          update(x2, y2); update(cx, cy);
        } else if (cmd === 'Q') {
          const x1 = Number(matches[i++]), y1 = Number(matches[i++]);
          cx = Number(matches[i++]); cy = Number(matches[i++]);
          update(x1, y1); update(cx, cy);
        } else if (cmd === 'q') {
          const x1 = cx + Number(matches[i++]), y1 = cy + Number(matches[i++]);
          cx += Number(matches[i++]); cy += Number(matches[i++]);
          update(x1, y1); update(cx, cy);
        } else if (cmd === 'A') {
          const rx = Number(matches[i++]), ry = Number(matches[i++]);
          const rot = Number(matches[i++]), laf = Number(matches[i++]), sf = Number(matches[i++]);
          cx = Number(matches[i++]); cy = Number(matches[i++]);
          update(cx, cy);
        } else if (cmd === 'a') {
          const rx = Number(matches[i++]), ry = Number(matches[i++]);
          const rot = Number(matches[i++]), laf = Number(matches[i++]), sf = Number(matches[i++]);
          cx += Number(matches[i++]); cy += Number(matches[i++]);
          update(cx, cy);
        } else if (cmd === 'Z' || cmd === 'z') {
          // No coords
        }
      } else {
        i++;
      }
    }
    if (minX === Infinity) return null;
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
  return null;
}

const elements = rootSvg.querySelectorAll('path, rect');
console.log(`Total elements: ${elements.length}`);
elements.forEach((el, idx) => {
  const b = getAbsoluteBounds(el);
  console.log(`SVG Element ${idx}: tag=${el.tagName.toLowerCase()}, bounds=${JSON.stringify(b)}`);
  if (el.tagName.toLowerCase() === 'path') {
    console.log(`  d: ${el.getAttribute('d').slice(0, 80)}...`);
  }
});
