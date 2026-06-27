const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest3.json', 'utf8'));

manifest.states.forEach((state, stateIdx) => {
  console.log(`\n================ State ${stateIdx}: ${state.name} ================`);
  const doc = new JSDOM(state.svg, { contentType: 'image/svg+xml' }).window.document;
  
  const printElInfo = (el, label) => {
    let fill = el.getAttribute('fill') || 'none';
    let stroke = el.getAttribute('stroke') || 'none';
    let opacity = el.getAttribute('opacity') || '1';
    let visibility = el.getAttribute('visibility') || 'visible';
    console.log(`  ${label}: <${el.tagName.toLowerCase()}> fill="${fill}" stroke="${stroke}" opacity="${opacity}" visibility="${visibility}"`);
  };

  // Find elements by position or selector
  // Doc Icon (x=40, y=66, size=32)
  doc.querySelectorAll('path, rect, g').forEach(el => {
    const id = el.getAttribute('data-motion-id') || '';
    if (id.includes('doc-icon') && id.includes('vector')) {
      printElInfo(el, `Doc Icon Vector [${id}]`);
    }
    if (id.includes('pen-icon') && id.includes('vector')) {
      printElInfo(el, `Pen Icon Vector [${id}]`);
    }
    if (id.includes('check-icon') && id.includes('vector')) {
      printElInfo(el, `Check Icon Vector [${id}]`);
    }
  });
});
