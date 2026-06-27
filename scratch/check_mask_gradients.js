const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgText = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svgText, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

console.log("Checking gradients referenced inside masks:");
const gradientIds = [
  'paint8_radial_motion_shared_state0',
  'paint10_radial_motion_shared_state0',
  'paint12_radial_motion_shared_state0',
  'paint14_radial_motion_shared_state0'
];

gradientIds.forEach(id => {
  const el = doc.getElementById(id);
  console.log(`id = "${id}" present: ${!!el}`);
  if (el) {
    console.log(`  stops count: ${el.querySelectorAll('stop').length}`);
    const stops = Array.from(el.querySelectorAll('stop')).map(s => {
      return `offset="${s.getAttribute('offset') || '0'}" color="${s.getAttribute('stop-color') || ''}" opacity="${s.getAttribute('stop-opacity') || '1'}"`;
    });
    console.log(`  stops: ${stops.join(' | ')}`);
  }
});
