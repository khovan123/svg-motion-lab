const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

function checkIsPie(element) {
  const tag = String(element.tagName).toLowerCase();
  if (tag === 'mask' || tag === 'g' || tag === 'path') {
    const paths = tag === 'path' ? [element] : Array.from(element.querySelectorAll('path'));
    if (paths.length === 0) return false;
    // Check if ALL paths in the element are within the pie chart bounds
    // (or at least one of them, to be safe, but let's check if it is within)
    for (const p of paths) {
      const d = p.getAttribute('d') || '';
      const match = d.match(/M\s*(-?\d*\.?\d+)\s*(-?\d*\.?\d+)/i);
      if (match) {
        const x = Number(match[1]);
        const y = Number(match[2]);
        if (x >= 210 && x <= 295 && y >= 45 && y <= 130) {
          return true;
        }
      }
    }
  }
  return false;
}

const testState = (stateIdx) => {
  const state = manifest.states[stateIdx];
  console.log(`\n--- State ${stateIdx} (${state.name}) ---`);
  const dom = new JSDOM(state.svg, { contentType: 'image/svg+xml' });
  const doc = dom.window.document;
  
  const matched = [];
  Array.from(doc.documentElement.children).forEach((child, idx) => {
    if (checkIsPie(child)) {
      matched.push({ idx, tag: child.tagName, id: child.getAttribute('id') || '', motionId: child.getAttribute('data-motion-id') || '' });
    }
  });
  console.log("Matched elements count:", matched.length);
  console.log(matched);
};

testState(0);
testState(7);
