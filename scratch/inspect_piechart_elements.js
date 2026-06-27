const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

manifest.states.forEach((state, sIdx) => {
  const dom = new JSDOM(state.svg, { contentType: 'image/svg+xml' });
  const doc = dom.window.document;
  
  // Find piechart group
  let pieGroup = null;
  doc.querySelectorAll('g').forEach(g => {
    const id = g.getAttribute('data-motion-id') || '';
    if (id.endsWith('/piechart[0]')) {
      pieGroup = g;
    }
  });

  console.log(`\nState ${sIdx} (${state.name}):`);
  if (pieGroup) {
    console.log(`  Pie Group ID: ${pieGroup.getAttribute('data-motion-id')}`);
    // Print all child elements with data-motion-id
    const paths = pieGroup.querySelectorAll('[data-motion-id]');
    paths.forEach((p, pIdx) => {
      console.log(`    Child [${pIdx}]: Tag=${p.tagName.toLowerCase()}, ID=${p.getAttribute('data-motion-id')}`);
      if (p.tagName.toLowerCase() === 'path') {
        console.log(`      d=${p.getAttribute('d')?.slice(0, 150)}`);
      }
    });
  } else {
    console.log("  Pie Group not found!");
  }
});
