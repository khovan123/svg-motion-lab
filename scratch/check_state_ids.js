const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

console.log("State IDs and Suffixes:");
manifest.states.forEach((state, idx) => {
  const suffix = String(state.id || '').replace(/:/g, '_');
  console.log(`State ${idx}: id="${state.id}", suffix="${suffix}"`);
});
