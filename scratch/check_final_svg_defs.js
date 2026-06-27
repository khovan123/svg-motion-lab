const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgText = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svgText, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

// We check for some specific IDs in defs
const ids = ['paint7_radial_motion_shared_state0', 'paint2_radial_motion_shared_state1', 'paint2_radial_motion_shared_state2'];
ids.forEach(id => {
  const el = doc.getElementById(id);
  console.log(`id = "${id}" present in defs: ${!!el}`);
  if (el) {
    console.log(`  Tag: <${el.tagName}>, outerHTML: ${el.outerHTML.slice(0, 150)}...`);
  }
});

// Let's print all child IDs of <defs>
const defs = doc.querySelector('defs');
console.log(`Total elements in <defs>: ${defs ? defs.children.length : 0}`);
if (defs) {
  const allIds = Array.from(defs.children).map(c => c.getAttribute('id')).filter(Boolean);
  console.log("Some IDs in defs:", allIds.slice(0, 20).join(', '));
  console.log("Contains paint7_radial_motion_shared_state0:", allIds.includes('paint7_radial_motion_shared_state0'));
  console.log("Contains paint2_radial_motion_shared_state1:", allIds.includes('paint2_radial_motion_shared_state1'));
  console.log("Contains paint2_radial_motion_shared_state2:", allIds.includes('paint2_radial_motion_shared_state2'));
}
