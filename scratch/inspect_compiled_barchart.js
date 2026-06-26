const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

// Find the bar-chart element or any group containing bar-chart in data-motion-id
console.log("Searching for bar-chart elements in compiled SVG:");
const barchartEl = doc.querySelector('[data-motion-id*="bar-chart"]');
if (!barchartEl) {
  console.log("No bar-chart element found!");
  process.exit(1);
}

function dumpNode(node, indent = "") {
  const tag = node.tagName.toLowerCase();
  const id = node.getAttribute('id') || '';
  const motionId = node.getAttribute('data-motion-id') || '';
  const fill = node.getAttribute('fill') || '';
  const opacity = node.getAttribute('opacity') || '';
  const vis = node.getAttribute('visibility') || '';
  const transform = node.getAttribute('transform') || '';
  const x = node.getAttribute('x') || '';
  const y = node.getAttribute('y') || '';
  const w = node.getAttribute('width') || '';
  const h = node.getAttribute('height') || '';
  const d = node.getAttribute('d') || '';
  
  console.log(`${indent}<${tag}> id="${id}" data-motion-id="${motionId}" fill="${fill}" opacity="${opacity}" visibility="${vis}" x="${x}" y="${y}" w="${w}" h="${h}" d="${d ? d.slice(0, 40) + '...' : ''}" transform="${transform ? transform.slice(0, 50) + '...' : ''}"`);
  
  Array.from(node.children).forEach(child => dumpNode(child, indent + "  "));
}

// Find the top-most bar-chart container
let topBarChart = barchartEl;
while (topBarChart.parentNode && topBarChart.parentNode.getAttribute && topBarChart.parentNode.getAttribute('data-motion-id') && topBarChart.parentNode.getAttribute('data-motion-id').includes('bar-chart')) {
  topBarChart = topBarChart.parentNode;
}

dumpNode(topBarChart);
