const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[3];
const dom = new JSDOM(state.svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

console.log("Gradients in State 3 original SVG defs:");
doc.querySelectorAll('linearGradient, radialGradient').forEach(g => {
  if (['paint17_radial_motion_shared', 'paint18_radial_motion_shared', 'paint15_radial_motion_shared', 'paint19_radial_motion_shared'].includes(g.id)) {
    console.log(`Gradient id="${g.id}":`);
    g.querySelectorAll('stop').forEach((s, idx) => {
      console.log(`  Stop ${idx}: offset="${s.getAttribute('offset')}" stop-color="${s.getAttribute('stop-color')}" stop-opacity="${s.getAttribute('stop-opacity')}"`);
    });
  }
});
