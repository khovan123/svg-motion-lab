const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
manifest.states.forEach((s, idx) => {
  console.log(`State ${idx}: id = ${s.id}, name = ${s.name}`);
});
