const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgContent = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svgContent, { contentType: 'image/svg+xml' });
const { document } = dom.window;

// Find the Piechart group
const piechart = document.querySelector('[data-motion-id="1:4181:@root/piechart[0]"]');
if (piechart) {
  console.log("Found Piechart group in SVG:", piechart.tagName);
  console.log(piechart.outerHTML.slice(0, 1000));
} else {
  console.log("Could not find Piechart group directly, searching by other attributes...");
  const exactRing = document.querySelector('[data-exact-ring]');
  if (exactRing) {
    console.log("Found exact-ring group:");
    console.log(exactRing.outerHTML.slice(0, 2000));
  }
}

console.log("\n--- Radial Gradients in defs ---");
const radGradients = document.querySelectorAll('radialGradient');
radGradients.forEach(g => {
  console.log(`id="${g.getAttribute('id')}"`);
  Array.from(g.children).forEach(stop => {
    console.log(`  stop: offset="${stop.getAttribute('offset')}" stop-color="${stop.getAttribute('stop-color')}" stop-opacity="${stop.getAttribute('stop-opacity') || '1'}"`);
  });
});
