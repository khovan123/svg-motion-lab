const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state0 = manifest.states[0];

const dom = new JSDOM(state0.svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

// Find container or refresh or vector-1
console.log("Original SVG Elements containing refresh or container/arrows:");
// Let's print the entire svg structure or find elements near container
const container = doc.querySelector('svg g'); // let's find all groups and print their tags/ids/classes
const groups = doc.querySelectorAll('g');
groups.forEach((g, idx) => {
  const html = g.outerHTML;
  if (html.includes('filter') || html.includes('clip-path') || html.includes('refresh')) {
    console.log(`Group [${idx}]: bounds=`, g.getBoundingClientRect ? g.getBoundingClientRect() : 'no getBoundingClientRect');
    console.log(html.slice(0, 300));
    console.log("-----------------------------------------");
  }
});
