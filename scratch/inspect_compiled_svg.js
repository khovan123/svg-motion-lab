const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgContent = fs.readFileSync('dist/animation.svg', 'utf8');
const doc = new JSDOM(svgContent, { contentType: 'image/svg+xml' }).window.document;

const refreshPath = doc.querySelector('path[data-motion-id*="hugeiconsrefresh-03-stroke-rounded-1"]');
console.log("refreshPath found:", !!refreshPath);
if (refreshPath) {
  console.log("refreshPath data-motion-id:", refreshPath.getAttribute('data-motion-id'));
  const filterGroup = refreshPath.closest('g[filter]');
  console.log("filterGroup found:", !!filterGroup);
  if (filterGroup) {
    console.log("filterGroup parent tag:", filterGroup.parentElement.tagName);
    console.log("filterGroup parent has data-refresh-rotor:", filterGroup.parentElement.hasAttribute('data-refresh-rotor'));
  }
}

const rotor = doc.querySelector('[data-refresh-rotor]');
console.log("rotor element found:", !!rotor);
if (rotor) {
  console.log("rotor tag:", rotor.tagName);
  console.log("rotor attributes:", [...rotor.attributes].map(a => `${a.name}="${a.value}"`));
}
