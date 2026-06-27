const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state = manifest.states[0];

const dom = new JSDOM(state.svg);
const doc = dom.window.document;
const paths = doc.querySelectorAll('path');

// Find paths that have similar d values
for (let i = 0; i < paths.length; i++) {
  for (let j = i + 1; j < paths.length; j++) {
    const d1 = paths[i].getAttribute('d');
    const d2 = paths[j].getAttribute('d');
    if (d1 && d2 && d1 === d2) {
      console.log(`\nDuplicate path found at indices ${i} and ${j}:`);
      console.log(`  Path ${i}: tag=${paths[i].tagName} fill="${paths[i].getAttribute('fill') || ''}" stroke="${paths[i].getAttribute('stroke') || ''}" filter="${paths[i].getAttribute('filter') || ''}" opacity="${paths[i].getAttribute('opacity') || ''}"`);
      console.log(`  Path ${j}: tag=${paths[j].tagName} fill="${paths[j].getAttribute('fill') || ''}" stroke="${paths[j].getAttribute('stroke') || ''}" filter="${paths[j].getAttribute('filter') || ''}" opacity="${paths[j].getAttribute('opacity') || ''}"`);
    }
  }
}
