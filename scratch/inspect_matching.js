const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

// We want to trace the matching in State 0
const state = manifest.states[0];
console.log("State name:", state.name);

// Find the spinner layer in manifest
const spinnerLayer = state.layers.find(l => l.name.includes('refresh-03'));
console.log("Spinner layer in manifest:", JSON.stringify(spinnerLayer, null, 2));

// Find the matches
// Let's run the actual mapping logic or inspect the SVG elements with data-motion-id
const doc = new JSDOM(state.svg, { contentType: 'image/svg+xml' }).window.document;
const allMapped = doc.querySelectorAll('[data-motion-id]');
console.log("\nAll mapped elements in State 0 SVG:");
allMapped.forEach(el => {
  const motionId = el.getAttribute('data-motion-id');
  if (motionId.includes('hugeicons') || motionId.includes('piechart') || motionId.includes('container')) {
    console.log(`Node tag: <${el.tagName}> id="${el.id}" data-motion-id="${motionId}"`);
    if (el.tagName.toLowerCase() === 'path') {
      console.log(`  d: ${el.getAttribute('d').slice(0, 100)}...`);
    } else if (el.tagName.toLowerCase() === 'rect') {
      console.log(`  x=${el.getAttribute('x')} y=${el.getAttribute('y')} w=${el.getAttribute('width')} h=${el.getAttribute('height')}`);
    }
  }
});
