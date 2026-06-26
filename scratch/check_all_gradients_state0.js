const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgText = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svgText, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

console.log("Stops of all state 0 gradients used in pie chart:");
const ids = [
  'paint7_radial_motion_shared_state0',
  'paint9_radial_motion_shared_state0',
  'paint11_radial_motion_shared_state0',
  'paint13_radial_motion_shared_state0',
  'paint15_radial_motion_shared_state0'
];

ids.forEach(id => {
  const el = doc.getElementById(id);
  if (el) {
    const stops = Array.from(el.querySelectorAll('stop')).map(s => {
      return `offset="${s.getAttribute('offset') || '0'}" color="${s.getAttribute('stop-color') || ''}" opacity="${s.getAttribute('stop-opacity') || '1'}"`;
    });
    console.log(`${id}:`, stops.join(' | '));
  } else {
    console.log(`${id} NOT found`);
  }
});
