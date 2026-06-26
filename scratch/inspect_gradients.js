const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgText = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svgText, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

const printGradient = (id) => {
  const el = doc.getElementById(id);
  if (el) {
    console.log(`\n--- Gradient ${id} ---`);
    console.log(el.outerHTML);
  } else {
    console.log(`\nGradient ${id} NOT found`);
  }
};

// Compare state 0 and state 1 gradients
printGradient('paint7_radial_motion_shared_state0');
printGradient('paint2_radial_motion_shared_state1');

printGradient('paint9_radial_motion_shared_state0');
printGradient('paint4_radial_motion_shared_state1');
