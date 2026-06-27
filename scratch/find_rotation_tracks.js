const fs = require('fs');

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const match = svg.match(/const D=(\{[\s\S]*?\}),svg/);
if (!match) {
  console.log("Could not find data D!");
  process.exit(1);
}

const data = JSON.parse(match[1]);
console.log("Tracks with non-zero rotations:");
data.tracks.forEach(t => {
  const angles = t.rotations ? t.rotations.map(r => r ? r.angle : 0) : [];
  const hasRotation = angles.some(a => a !== 0);
  if (hasRotation) {
    console.log(`- Track ID: ${t.id} (${t.tag})`);
    console.log(`  Angles:`, JSON.stringify(angles));
  }
});
