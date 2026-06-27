const fs = require('fs');
const { JSDOM } = require('jsdom');

const m = JSON.parse(fs.readFileSync('motion-manifest3.json', 'utf8'));

m.states.forEach((state, idx) => {
  console.log(`\n--- State ${idx}: ${state.name} ---`);
  const doc = new JSDOM(state.svg, { contentType: 'image/svg+xml' }).window.document;
  
  const texts = [];
  doc.querySelectorAll('text, path').forEach(el => {
    const textContent = el.textContent || '';
    const d = el.getAttribute('d') || '';
    // Let's identify the label paths or texts
    let label = null;
    if (textContent.includes('Giao') || textContent.includes('Thực') || textContent.includes('nộp') || textContent.includes('Đã')) {
      label = textContent.trim();
    }
    if (label) {
      texts.push({ el, label });
    }
  });

  if (texts.length === 0) {
    // If text was converted to paths, let's look for them by location or find all text elements
    doc.querySelectorAll('text').forEach(el => {
      texts.push({ el, label: el.textContent.trim() });
    });
  }

  texts.forEach(item => {
    let current = item.el;
    let path = [];
    while (current && current.tagName.toLowerCase() !== 'svg') {
      let info = `<${current.tagName}`;
      Array.from(current.attributes).forEach(attr => {
        if (['id', 'data-motion-id', 'transform', 'opacity', 'visibility', 'clip-path'].includes(attr.name)) {
          info += ` ${attr.name}="${attr.value}"`;
        }
      });
      info += '>';
      path.unshift(info);
      current = current.parentNode;
    }
    console.log(`  Label "${item.label}":`);
    console.log(`    Hierarchy: ${path.join(' -> ')}`);
  });
});
