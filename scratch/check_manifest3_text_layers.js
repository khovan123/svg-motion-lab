const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest3.json', 'utf8'));

manifest.states.forEach((state, stateIdx) => {
  console.log(`\n================ State ${stateIdx}: ${state.name} ================`);
  state.layers.forEach(l => {
    if (l.type === 'TEXT' || l.name.includes('Giao') || l.name.includes('Thực') || l.name.includes('Đã')) {
      console.log(`  ID: "${l.id}" | Name: "${l.name}" | Type: "${l.type}" | opacity: ${l.opacity} | visible: ${l.visible} | bounds: x=${l.bounds.x}, y=${l.bounds.y}, w=${l.bounds.width}, h=${l.bounds.height}`);
    }
  });
});
