const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

console.log('Manifest schema:', manifest.schema);
console.log('States list:');
manifest.states.forEach((state, idx) => {
  console.log(`  State ${idx}: id=${state.id}, name="${state.name}"`);
});
