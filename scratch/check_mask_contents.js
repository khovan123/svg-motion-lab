const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgText = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svgText, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

console.log("Checking mask elements in <defs>:");
const maskIds = [
  'mask0_motion_shared_state0',
  'mask1_motion_shared_state0',
  'mask2_motion_shared_state0',
  'mask3_motion_shared_state0'
];

maskIds.forEach(id => {
  const el = doc.getElementById(id);
  if (el) {
    console.log(`\n--- Mask ${id} ---`);
    console.log(el.outerHTML);
  } else {
    console.log(`\nMask ${id} NOT found`);
  }
});
