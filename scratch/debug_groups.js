const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
const { window } = dom;
global.DOMParser = window.DOMParser;
global.XMLSerializer = window.XMLSerializer;

const state = manifest.states[2];
const doc = new DOMParser().parseFromString(state.svg, 'image/svg+xml');
const groups = doc.querySelectorAll('g');
console.log(`State 2 has ${groups.length} <g> elements:`);
groups.forEach((g, idx) => {
  const motionId = g.getAttribute('data-motion-id');
  const childTags = [...g.children].map(c => c.tagName).join(', ');
  console.log(`Group ${idx}: data-motion-id: "${motionId || 'none'}", child tags: [${childTags}]`);
  if (motionId && (motionId.includes('column') || motionId.includes('refresh') || motionId.includes('container'))) {
    // Print first 100 chars of serialization
    console.log(`  Content snippet: ${new XMLSerializer().serializeToString(g).slice(0, 150)}...`);
  }
});
