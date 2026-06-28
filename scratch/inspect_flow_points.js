const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

console.log('flowStartingPoints:', JSON.stringify(manifest.flowStartingPoints, null, 2));
console.log('prototype.flowStartingPoints:', manifest.prototype ? JSON.stringify(manifest.prototype.flowStartingPoints, null, 2) : 'none');
