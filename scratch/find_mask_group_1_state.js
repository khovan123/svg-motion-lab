const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

// Find which state first has mask-group[1], mask-group[2], mask-group[3]
for (let i = 0; i < manifest.states.length; i++) {
  const state = manifest.states[i];
  const dom = new JSDOM(state.svg);
  const doc = dom.window.document;
  const mg1 = doc.querySelector('[data-motion-id*="mask-group[1]"]');
  if (mg1) {
    console.log(`State ${i} (${state.name || state.id}) has mask-group[1]`);
    const all = doc.querySelectorAll('[data-motion-id*="mask-group"]');
    all.forEach(el => console.log('  ', el.tagName, el.getAttribute('data-motion-id')));
    break;
  }
}
