const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[0];
const dom = new JSDOM(state.svg, { contentType: 'image/svg+xml' });
const rootSvg = dom.window.document.documentElement;

// Re-write dumpNode to skip defs and print recursively
function dumpNode(node, indent = "") {
  const tag = node.tagName.toLowerCase();
  if (tag === 'defs' || tag === 'filter' || tag === 'radialgradient' || tag === 'lineargradient' || tag === 'clippath' || tag === 'mask') {
    return;
  }
  
  const id = node.getAttribute('id') || '';
  const fill = node.getAttribute('fill') || '';
  const x = node.getAttribute('x') || '';
  const y = node.getAttribute('y') || '';
  const w = node.getAttribute('width') || '';
  const h = node.getAttribute('height') || '';
  const d = node.getAttribute('d') || '';
  
  console.log(`${indent}<${tag}> id="${id}" fill="${fill}" x="${x}" y="${y}" w="${w}" h="${h}" d="${d ? d.slice(0, 40) + '...' : ''}"`);
  
  Array.from(node.children).forEach(child => dumpNode(child, indent + "  "));
}

const scene = rootSvg.querySelector('#motion-scene') || rootSvg;
dumpNode(scene);
