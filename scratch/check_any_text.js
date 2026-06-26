const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

manifest.states.forEach((state, idx) => {
  if (state.svg) {
    const dom = new JSDOM(state.svg);
    const doc = dom.window.document;
    const texts = doc.querySelectorAll('text');
    console.log(`State ${idx} (${state.name}): text elements count = ${texts.length}`);
  } else {
    console.log(`State ${idx} (${state.name}): no SVG`);
  }
});
