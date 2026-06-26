const fs = require('fs');

const m = JSON.parse(fs.readFileSync('motion-manifest3.json', 'utf8'));

m.states.forEach((state, stateIdx) => {
  console.log(`\n================ State ${stateIdx}: ${state.name} ================`);
  state.layers.forEach(l => {
    if (l.name.includes('Giao') || l.name.includes('Thực') || l.name.includes('Đã')) {
      console.log(`Layer: "${l.name}"`);
      console.log(`  fills:`, JSON.stringify(l.fills));
      console.log(`  opacity:`, l.opacity);
      console.log(`  visible:`, l.visible);
    }
  });
});
