const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const uniqueNames = new Set();
manifest.states.forEach(state => {
  state.layers.forEach(layer => {
    uniqueNames.add(layer.name);
  });
});

console.log("Unique layer names in manifest:", [...uniqueNames].sort());
