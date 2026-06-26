const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state0 = manifest.states[0];

const dom = new JSDOM(state0.svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

// Let's locate the main refresh path: it has coordinates around x=166.5, y=170.5.
// Let's find any paths with "M166.5 181" or similar
const mainPath = Array.from(doc.querySelectorAll('path')).find(p => p.getAttribute('d')?.includes('M166.5 181') || p.getAttribute('d')?.includes('M166.5 170.5') || p.getAttribute('d')?.includes('166.5'));
if (!mainPath) {
  console.log("Could not find main path with 166.5");
  // Let's print all paths in the SVG to inspect
  Array.from(doc.querySelectorAll('path')).forEach((p, idx) => {
    console.log(`Path [${idx}]: d=${p.getAttribute('d')?.slice(0, 80)}`);
  });
  return;
}

console.log("Main Path parent chain:");
let curr = mainPath;
while (curr) {
  let attrs = '';
  if (curr.getAttribute) {
    for (const attr of curr.getAttributeNames()) {
      attrs += ` ${attr}="${curr.getAttribute(attr)}"`;
    }
  }
  console.log(`- <${curr.tagName}${attrs}>`);
  curr = curr.parentNode;
}

// Let's look at the siblings of the outer group of the main path
const clipGroup = mainPath.parentNode.parentNode; // Group [18] <g clip-path="url(#clip4_motion_shared)">
console.log("\nSiblings of the clipGroup:");
Array.from(clipGroup.parentNode.children).forEach((child, idx) => {
  console.log(`Child [${idx}]: Tag=${child.tagName}, id=${child.id}, data-motion-id=${child.getAttribute('data-motion-id') || 'none'}`);
  console.log(child.outerHTML.slice(0, 150));
});
