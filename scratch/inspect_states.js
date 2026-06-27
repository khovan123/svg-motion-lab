const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

manifest.states.forEach((state, idx) => {
  console.log(`State [${idx}]: ID=${state.id}, Name="${state.name}"`);
});
