const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
console.log('Top level keys:', Object.keys(manifest));
if (manifest.states && manifest.states[0]) {
  console.log('State 0 keys:', Object.keys(manifest.states[0]));
}
