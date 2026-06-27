const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

manifest.states.forEach((state, stateIdx) => {
  console.log(`\nState ${stateIdx}: id="${state.id}" name="${state.name}"`);
  if (!state.svg) {
    console.log('  No SVG snapshot');
    return;
  }
  const dom = new JSDOM(state.svg);
  const doc = dom.window.document;
  
  // Find all elements with data-motion-id
  const elements = doc.querySelectorAll('[data-motion-id]');
  elements.forEach(el => {
    const motionId = el.getAttribute('data-motion-id');
    const tagName = el.tagName.toLowerCase();
    let details = '';
    if (tagName === 'rect') {
      details = `x=${el.getAttribute('x')} y=${el.getAttribute('y')} width=${el.getAttribute('width')} height=${el.getAttribute('height')} rx=${el.getAttribute('rx')}`;
    } else if (tagName === 'path') {
      details = `d="${el.getAttribute('d').substring(0, 60)}..."`;
    }
    console.log(`  SVG Element: tag=${tagName} data-motion-id="${motionId}" ${details}`);
  });
});
