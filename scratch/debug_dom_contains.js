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

// Let's find the grandparent <g> wrapping columns
// We know from dump_state0_scene.js:
// <g> wrapping Column 4 is a child of the grandparent <g>.
const col4rect = rootSvg.querySelector('path[fill="url(#paint1_radial_motion_shared)"]');
const col3rect = rootSvg.querySelector('path[fill="url(#paint2_radial_motion_shared)"]');
const col2rect = rootSvg.querySelector('path[fill="url(#paint3_radial_motion_shared)"]');
const col1rect = rootSvg.querySelector('path[fill="url(#paint4_radial_motion_shared)"]');

const col4group = col4rect.parentNode;
const col3group = col3rect.parentNode;
const col2group = col2rect.parentNode;
const col1group = col1rect.parentNode;

const grandparent = col4group.parentNode;

console.log("Grandparent element tag:", grandparent.tagName);
console.log("Are all columns in grandparent?");
console.log("  col4group in grandparent:", grandparent.contains(col4group));
console.log("  col3group in grandparent:", grandparent.contains(col3group));
console.log("  col2group in grandparent:", grandparent.contains(col2group));
console.log("  col1group in grandparent:", grandparent.contains(col1group));

console.log("\nActual DOM parent nodes:");
console.log("  col4group parent:", col4group.parentNode === grandparent);
console.log("  col3group parent:", col3group.parentNode === grandparent);
console.log("  col2group parent:", col2group.parentNode === grandparent);
console.log("  col1group parent:", col1group.parentNode === grandparent);
