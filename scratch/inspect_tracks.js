const fs = require('fs');
const ir = JSON.parse(fs.readFileSync('dist/prototype-ir.json', 'utf8'));
const tracks = ir.smartAnimate.tracks || [];

console.log(`Total tracks: ${tracks.length}`);
tracks.forEach((t, i) => {
  const presentStates = t.present.map((p, idx) => p ? idx : null).filter(v => v !== null);
  console.log(`[Track ${i}] ID: ${t.id}, Tag: ${t.tag}, Present in states: [${presentStates.join(', ')}], PathMode: ${t.pathMode}`);
});
