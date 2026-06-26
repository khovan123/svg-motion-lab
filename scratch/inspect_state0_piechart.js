const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state0 = manifest.states[0];
const dom = new JSDOM(state0.svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

console.log("Checking state 0 original SVG:");
// Find elements related to piechart or groups containing piechart
const pie = Array.from(doc.querySelectorAll('*')).find(el => el.getAttribute('data-name') && el.getAttribute('data-name').toLowerCase().includes('piechart'));
if (pie) {
  console.log(`Found piechart in state 0: tag = <${pie.tagName}>, outerHTML:`);
  console.log(pie.outerHTML);
} else {
  console.log("No element with data-name containing 'piechart' found.");
  // Let's search by ID
  const pieById = doc.querySelector('[id*="1:4234"]');
  if (pieById) {
    console.log("Found piechart by ID 1:4234:", pieById.outerHTML);
  }
}
