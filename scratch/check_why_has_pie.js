const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('motion-manifest3.json', 'utf8'));

manifest.states.forEach((s, stateIdx) => {
  s.layers.forEach(l => {
    const n = (l.name || '').toLowerCase();
    const sid = (l.stableNodeId || '').toLowerCase();
    const id = (l.id || '').toLowerCase();
    if (n.includes('pie') || sid.includes('pie') || id.includes('pie')) {
      console.log(`State ${stateIdx}: Name="${l.name}" | ID="${l.id}" | stableId="${l.stableNodeId}"`);
    }
  });
});
