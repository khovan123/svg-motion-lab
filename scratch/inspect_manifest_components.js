const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

console.log('Searching for "15" in manifest...');
let found = 0;

// Search in states
manifest.states.forEach((state, sIdx) => {
  if (state.id.includes('15:') || state.id.includes('982') || state.name.includes('15')) {
    console.log(`Found in state: index=${sIdx}, id=${state.id}, name="${state.name}"`);
    found++;
  }
  state.layers.forEach((layer, lIdx) => {
    if (layer.id.includes('15:') || layer.id.includes('982') || layer.stableNodeId.includes('15:') || layer.stableNodeId.includes('982')) {
      if (found < 20) {
        console.log(`Found in state ${state.name} layer ${lIdx}: id=${layer.id}, name="${layer.name}", stableNodeId="${layer.stableNodeId}"`);
      }
      found++;
    }
  });
});

console.log(`Total occurrences found: ${found}`);
