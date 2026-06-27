const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

manifest.states.forEach((state, sIdx) => {
  const dom = new JSDOM(state.svg, { contentType: 'image/svg+xml' });
  const doc = dom.window.document;
  
  // Find pie chart group
  let pieGroup = null;
  doc.querySelectorAll('g').forEach(g => {
    const id = g.getAttribute('data-motion-id') || '';
    if (id.endsWith('/piechart[0]')) {
      pieGroup = g;
    }
  });

  console.log(`\nState ${sIdx} (${state.name}):`);
  if (pieGroup) {
    const paths = pieGroup.querySelectorAll('[data-motion-id]');
    paths.forEach(p => {
      const id = p.getAttribute('data-motion-id') || '';
      if (p.tagName.toLowerCase() === 'path') {
        const d = p.getAttribute('d') || '';
        // count commands
        const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
        const commands = tokens.filter(x => /^[a-zA-Z]$/.test(x)).join('');
        console.log(`    - ID: ${id}`);
        console.log(`      Commands: ${commands} (${tokens.filter(x => !/^[a-zA-Z]$/.test(x)).length} numbers)`);
        console.log(`      Path: ${d.slice(0, 100)}...`);
      }
    });
  } else {
    console.log("  Pie Group not found!");
  }
});
