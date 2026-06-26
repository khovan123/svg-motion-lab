const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

if (manifest.prototype && manifest.prototype.reactions) {
  console.log(JSON.stringify(manifest.prototype.reactions.slice(0, 2), null, 2));
}
