const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

[0, 1, 2].forEach(sIdx => {
  const state = manifest.states[sIdx];
  console.log(`\n================ State ${sIdx} (${state.name}) svgNodeMap ================`);
  const nodes = state.svgNodeMap || [];
  nodes.forEach(n => {
    if (n.stableNodeId.includes('background') || n.stableNodeId.includes('Background')) {
      console.log(`  StableNodeId: ${n.stableNodeId}, Tag: ${n.tag}, Id: ${n.id}`);
    }
  });
});
