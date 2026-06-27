const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[0];
const dom = new JSDOM(state.svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

const pie = doc.querySelector('[data-motion-id="1:4181:@root/piechart[0]"]');
if (pie) {
  console.log("State 0 original piechart XML:");
  console.log(pie.outerHTML);
} else {
  console.log("Piechart group not found by exact motion ID in State 0.");
}
