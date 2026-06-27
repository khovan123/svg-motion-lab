const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[0];
const dom = new JSDOM(state.svg, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

console.log(`Checking State 0 (${state.name}) piechart:`);
const elements = Array.from(doc.querySelectorAll('*')).filter(el => {
  const motionId = el.getAttribute('data-motion-id') || '';
  return motionId.includes('piechart');
});

elements.forEach((el, idx) => {
  console.log(`Element ${idx}: <${el.tagName}> data-motion-id="${el.getAttribute('data-motion-id')}" fill="${el.getAttribute('fill') || ''}" mask="${el.getAttribute('mask') || ''}" opacity="${el.getAttribute('opacity') || ''}"`);
  if (el.tagName.toLowerCase() === 'path') {
    console.log(`  d: ${el.getAttribute('d').slice(0, 80)}...`);
  }
});
