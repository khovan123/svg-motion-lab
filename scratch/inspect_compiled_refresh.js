const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgContent = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svgContent, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

const refreshPath = doc.querySelector('path[data-motion-id*="hugeiconsrefresh-03-stroke-rounded-1"]');
console.log("refreshPath found:", !!refreshPath);
if (refreshPath) {
  console.log("refreshPath ID:", refreshPath.getAttribute('data-motion-id'));
  const filterGroup = refreshPath.closest('g[filter]');
  console.log("filterGroup found:", !!filterGroup);
  if (filterGroup) {
    console.log("filterGroup ID:", filterGroup.getAttribute('data-motion-id'));
    const rotor = filterGroup.parentElement;
    console.log("rotor found:", !!rotor);
    if (rotor) {
      console.log("rotor ID:", rotor.getAttribute('data-motion-id'));
      console.log("rotor data-refresh-rotor:", rotor.getAttribute('data-refresh-rotor'));
      console.log("rotor transform:", rotor.getAttribute('transform'));
    }
  }
}

console.log("\nSearching for any element with data-refresh-rotor:");
const allRotors = doc.querySelectorAll('[data-refresh-rotor]');
console.log("Found rotors count:", allRotors.length);
allRotors.forEach(r => {
  console.log(`Tag: <${r.tagName}>, ID: ${r.getAttribute('data-motion-id') || 'none'}, data-refresh-rotor: ${r.getAttribute('data-refresh-rotor')}`);
});
