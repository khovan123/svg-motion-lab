const fs = require('fs');

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const match = svg.match(/const D=(\{[\s\S]*?\}),svg/);
if (!match) {
  console.log("Could not find data D!");
  process.exit(1);
}

const data = JSON.parse(match[1]);
console.log("All tracks containing hugeiconsrefresh:");
data.tracks.forEach(t => {
  if (t.id.includes('hugeiconsrefresh')) {
    console.log(`\n================= Track: ${t.id} =================`);
    console.log(`Tag: ${t.tag}`);
    console.log(`Present:`, JSON.stringify(t.present));
    console.log(`Rotations:`, JSON.stringify(t.rotations));
    console.log(`Transforms:`, JSON.stringify(t.transforms));
    console.log(`pathMode: ${t.pathMode}`);
    if (t.paths) {
      console.log(`Number of paths: ${t.paths.filter(Boolean).length}`);
    }
  }
});
