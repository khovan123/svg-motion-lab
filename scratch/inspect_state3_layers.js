const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state3 = manifest.states[3];
console.log(`State 3: ${state3.name}`);
state3.layers.forEach(l => {
  console.log(`Layer: name="${l.name}" key="${l.key}" type="${l.type}" bounds=${JSON.stringify(l.bounds)} stableNodeId="${l.stableNodeId}" semanticPath="${l.semanticPath}"`);
});
