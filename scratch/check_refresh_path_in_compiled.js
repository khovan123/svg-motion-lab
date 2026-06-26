const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgContent = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svgContent, { contentType: 'image/svg+xml' });
const { document } = dom.window;

console.log("SVG loaded.");

const allMatches = document.querySelectorAll('[data-motion-id*="hugeiconsrefresh-03-stroke-rounded-1"]');
console.log(`Total elements matching "hugeiconsrefresh-03-stroke-rounded-1": ${allMatches.length}`);
allMatches.forEach((el, idx) => {
  console.log(`Match ${idx}: tag=${el.tagName}, data-motion-id="${el.getAttribute('data-motion-id')}", filter="${el.getAttribute('filter') || ''}"`);
});

const refreshPath = document.querySelector('path[data-motion-id*="hugeiconsrefresh-03-stroke-rounded-1"]');
console.log("refreshPath found:", !!refreshPath);
if (refreshPath) {
  console.log("refreshPath tag:", refreshPath.tagName);
  const filterGroup = refreshPath.closest('g[filter]');
  console.log("filterGroup found:", !!filterGroup);
  if (filterGroup) {
    console.log("filterGroup tag:", filterGroup.tagName);
    const rotor = filterGroup.parentElement;
    console.log("rotor found:", !!rotor);
    if (rotor) {
      console.log("rotor tag:", rotor.tagName);
      console.log("rotor data-refresh-rotor:", rotor.getAttribute('data-refresh-rotor'));
    }
  }
}

const rotorByAttr = document.querySelector('[data-refresh-rotor]');
console.log("rotorByAttr found:", !!rotorByAttr);
if (rotorByAttr) {
  console.log("rotorByAttr tag:", rotorByAttr.tagName);
  console.log("rotorByAttr data-motion-id:", rotorByAttr.getAttribute('data-motion-id'));
  console.log("rotorByAttr parent:", rotorByAttr.parentElement.tagName, "parent id:", rotorByAttr.parentElement.getAttribute('id'));
}
