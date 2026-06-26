const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state = manifest.states[0];
const dom = new JSDOM(state.svg);
const doc = dom.window.document;
const paths = doc.querySelectorAll('path');

// Let's implement getPathBounds with logging
function getPathBoundsDebug(d) {
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
      } else if (cmd === 'Z' || cmd === 'z') {
        // No coords
      }
    } else {
      // It's a coordinate but without command - SVG paths allow omitted commands!
      // When command is omitted, it defaults to the previous command (except M -> L)
      // Wait, getPathBounds doesn't handle omitted commands! It just skips them!
      console.log(`Warning: token "${token}" is coordinate without command at index ${i}`);
      i++;
    }
  }
  return { minX, maxX, minY, maxY };
}

// Find path for Nguyễn Anh Thư
paths.forEach((p, idx) => {
  const d = p.getAttribute('d') || '';
  if (d.includes('M113.46')) {
    console.log(`Path ${idx} is likely the text path.`);
    const bounds = getPathBoundsDebug(d);
    console.log('Computed bounds:', bounds);
  }
});
