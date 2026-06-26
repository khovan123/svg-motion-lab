const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state0 = manifest.states[0];

const dom = new JSDOM(state0.svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

const clipGroup = doc.querySelectorAll('svg > g')[19] || doc.querySelector('g[clip-path="url(#clip4_motion_shared)"]');
if (clipGroup) {
  console.log("clipGroup HTML:");
  console.log(clipGroup.outerHTML);
} else {
  console.log("clipGroup not found!");
}
