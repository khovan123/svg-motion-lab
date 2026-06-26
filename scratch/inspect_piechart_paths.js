const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

console.log("Path 'd' attributes for yellow[0] and yellow[1] across states:");

manifest.states.forEach((state, sIdx) => {
  const dom = new JSDOM(state.svg, { contentType: 'image/svg+xml' });
  const doc = dom.window.document;
  
  // Find yellow[0] and yellow[1] paths.
  // Note: in original SVG, they might have their original data-motion-ids
  // Let's find paths containing 'yellow' in their ID or having bounds matching the pie chart.
  const yellowPaths = [];
  doc.querySelectorAll('path').forEach(p => {
    const id = p.getAttribute('data-motion-id') || '';
    if (id.toLowerCase().includes('yellow')) {
      yellowPaths.push({ id, d: p.getAttribute('d') });
    }
  });
  
  console.log(`\nState ${sIdx} (${state.name}):`);
  if (yellowPaths.length === 0) {
    console.log("  No yellow paths found!");
  } else {
    yellowPaths.forEach(yp => {
      console.log(`  ID: ${yp.id}`);
      console.log(`  d:  ${yp.d}`);
    });
  }
});
