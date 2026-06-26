const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[0];
const dom = new JSDOM(state.svg, { contentType: 'image/svg+xml' });
const rootSvg = dom.window.document.documentElement;

const scene = rootSvg.querySelector('#motion-scene') || rootSvg;

function dumpNode(node, indent = "") {
  const tag = node.tagName.toLowerCase();
  const id = node.getAttribute('id') || '';
  const fill = node.getAttribute('fill') || '';
  const x = node.getAttribute('x') || '';
  const y = node.getAttribute('y') || '';
  const w = node.getAttribute('width') || '';
  const h = node.getAttribute('height') || '';
  
  console.log(`${indent}<${tag}> id="${id}" fill="${fill}" x="${x}" y="${y}" w="${w}" h="${h}"`);
  
  if (tag !== 'path' && tag !== 'rect') {
    Array.from(node.children).forEach(child => dumpNode(child, indent + "  "));
  }
}

dumpNode(scene);
