const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

console.log("Searching for loading/refresh/spinner/progress layers across all states:");

const seenIds = new Set();

manifest.states.forEach((state, sIdx) => {
  state.layers.forEach(l => {
    const name = String(l.name).toLowerCase();
    const id = l.stableNodeId;
    if (name.includes('loading') || name.includes('refresh') || name.includes('spinner') || name.includes('progress') || name.includes('load')) {
      if (!seenIds.has(id)) {
        seenIds.add(id);
        console.log(`State ${sIdx} (${state.name}):`);
        console.log(`  Layer name: ${l.name}`);
        console.log(`  Stable ID: ${l.stableNodeId}`);
        console.log(`  Type: ${l.type}`);
        console.log(`  Bounds: ${JSON.stringify(l.bounds)}`);
        console.log(`  Parent ID: ${l.parentStableNodeId}`);
      }
    }
  });
});
