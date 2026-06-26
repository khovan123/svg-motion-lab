const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const inspectStatePie = (stateIndex) => {
  const state = manifest.states[stateIndex];
  console.log(`\n================ STATE ${stateIndex} (${state.name}) ================`);
  const dom = new JSDOM(state.svg, { contentType: 'image/svg+xml' });
  const doc = dom.window.document;
  
  // Find piechart elements by stableNodeId (matching 'piechart')
  const elements = Array.from(doc.querySelectorAll('*')).filter(el => {
    const motionId = el.getAttribute('data-motion-id') || '';
    return motionId.includes('piechart');
  });
  
  console.log(`Found ${elements.length} elements under piechart stableNodeId:`);
  elements.forEach((el, idx) => {
    console.log(`Element ${idx}: <${el.tagName}> id="${el.getAttribute('id') || ''}" data-motion-id="${el.getAttribute('data-motion-id') || ''}" fill="${el.getAttribute('fill') || ''}" mask="${el.getAttribute('mask') || ''}"`);
    if (el.tagName.toLowerCase() === 'path') {
      console.log(`  d: ${el.getAttribute('d').slice(0, 50)}...`);
    }
  });

  // Print all defs
  const defs = doc.querySelectorAll('defs *');
  console.log("Defs Count:", defs.length);
  defs.forEach(d => {
    const id = d.getAttribute('id') || '';
    if (id.includes('paint') || id.includes('mask')) {
      console.log(`  <${d.tagName} id="${id}"> outerHTML: ${d.outerHTML.slice(0, 200)}`);
    }
  });
};

inspectStatePie(0);
inspectStatePie(1);
inspectStatePie(2);
inspectStatePie(3);
inspectStatePie(4);
inspectStatePie(5);
inspectStatePie(6);
inspectStatePie(7);
