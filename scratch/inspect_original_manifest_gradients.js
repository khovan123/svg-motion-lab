const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state7 = manifest.states.find(s => s.id === '1:4402');
if (state7 && state7.svg) {
  console.log("Found State 7 SVG snapshot.");
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM(state7.svg, { contentType: 'image/svg+xml' });
  const { document } = dom.window;
  
  const rads = document.querySelectorAll('radialGradient');
  console.log(`Total radial gradients in State 7 snapshot: ${rads.length}`);
  rads.forEach(g => {
    console.log(`id="${g.getAttribute('id')}"`);
    Array.from(g.children).forEach(stop => {
      console.log(`  stop: offset="${stop.getAttribute('offset')}" stop-color="${stop.getAttribute('stop-color')}"`);
    });
  });
} else {
  console.log("Could not find State 7 or SVG!");
}
