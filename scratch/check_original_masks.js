const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

manifest.states.forEach((state, idx) => {
  console.log(`\n================ STATE [${idx}]: ${state.name} ================`);
  const doc = new JSDOM(state.svg, { contentType: 'image/svg+xml' }).window.document;
  
  // Find masks
  const masks = doc.querySelectorAll('mask');
  console.log("Masks defined:");
  masks.forEach(m => {
    console.log(` - ID="${m.id}" bounds: x=${m.getAttribute('x')} y=${m.getAttribute('y')} w=${m.getAttribute('width')} h=${m.getAttribute('height')}`);
  });
  
  // Find spinner and its mask
  const spinner = doc.querySelector('[data-motion-id*="hugeiconsrefresh-03-stroke-rounded-1"]');
  if (spinner) {
    console.log("Spinner group tag:", spinner.tagName);
    console.log("Spinner data-motion-id:", spinner.getAttribute('data-motion-id'));
    console.log("Spinner mask attribute:", spinner.getAttribute('mask'));
  } else {
    console.log("Spinner NOT found!");
  }
  
  // Find elements referencing masks
  const masked = doc.querySelectorAll('[mask]');
  console.log("Masked elements:");
  masked.forEach(el => {
    console.log(` - Tag <${el.tagName}> data-motion-id="${el.getAttribute('data-motion-id')}" references mask="${el.getAttribute('mask')}"`);
  });
});
