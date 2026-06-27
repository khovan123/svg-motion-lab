const fs = require('fs');

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const match = svg.match(/const D=(\{[\s\S]*?\}),svg/);
if (!match) {
  console.log("Could not find data D!");
  process.exit(1);
}

const data = JSON.parse(match[1]);
console.log(`Numeric Attributes:`, data.numeric);
console.log(`Color Attributes:`, data.colors);

const targetIds = [
  '1:4181:@root/bar-chart[0]/2nd-column[0]/background[0]',
  '1:4181:@root/bar-chart[0]/2nd-column[0]/active[0]'
];

data.tracks.forEach(t => {
  if (targetIds.includes(t.id)) {
    console.log(`\n================= Track: ${t.id} =================`);
    console.log(`Tag: ${t.tag}`);
    console.log(`Present:`, JSON.stringify(t.present));
    console.log(`Colors:`, JSON.stringify(t.colors));
    console.log(`Transforms:`, JSON.stringify(t.transforms));
    console.log(`Rotations:`, JSON.stringify(t.rotations));
    console.log(`pathMode: ${t.pathMode}`);
    if (t.paths) {
      console.log(`Paths list count: ${t.paths.length}`);
      t.paths.forEach((p, i) => {
        console.log(`  State ${i}: ${p ? p.slice(0, 80) + '...' : 'null'}`);
      });
    }
  }
});
