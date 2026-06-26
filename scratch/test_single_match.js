const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", { runScripts: "dangerously" });
const { window } = dom;
global.DOMParser = window.DOMParser;
global.XMLSerializer = window.XMLSerializer;

// Replicate functions
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

const state = manifest.states[0];
const doc = new DOMParser().parseFromString(state.svg, 'image/svg+xml');
const pathElements = doc.querySelectorAll('path');
console.log(`Found ${pathElements.length} paths in SVG.`);
pathElements.forEach((el, idx) => {
  const d = el.getAttribute('d') || '';
  const id = el.getAttribute('data-motion-id');
  const bounds = getAbsoluteBounds(el);
  console.log(`Path [${idx}] ID: ${id}, d="${d.slice(0, 40)}...", bounds=${JSON.stringify(bounds)}`);
});
