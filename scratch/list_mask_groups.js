const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const ids = new Set();
manifest.states.forEach((s, sIdx) => {
  const match = s.svg.match(/data-motion-id="([^"]*)"/g);
  if (match) {
    match.forEach(m => {
      const id = m.slice(16, -1);
      if (id.includes('mask-group')) {
        ids.add(sIdx + ': ' + id);
      }
    });
  }
});
console.log([...ids].sort());
