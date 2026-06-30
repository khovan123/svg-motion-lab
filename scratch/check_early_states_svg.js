const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

// Check what piechart data-motion-ids are in the SVG of some intermediate state
for (let idx of [1, 2, 8, 16]) {
  const state = manifest.states[idx];
  if (!state) continue;
  const dom = new JSDOM(state.svg);
  const doc = dom.window.document;
  const all = doc.querySelectorAll('[data-motion-id*="mask-group"]');
  if (all.length > 0) {
    console.log(`State ${idx} (${state.name}):`, all.length, 'mask-group elements');
    all.forEach(el => console.log('  ', el.tagName, el.getAttribute('data-motion-id')));
    break;
  } else {
    // Check for any piechart elements at all
    const pie = doc.querySelectorAll('[data-motion-id*="piechart"]');
    if (pie.length > 0) {
      console.log(`State ${idx} (${state.name}): piechart elements found (no mask-group ids)`);
      pie.forEach(el => console.log('  ', el.tagName, el.getAttribute('data-motion-id')));
    } else {
      console.log(`State ${idx} (${state.name}): NO piechart elements`);
    }
  }
}
