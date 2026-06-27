const fs = require('fs');

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const match = svg.match(/const D=(\{[\s\S]*?\}),svg/);
if (!match) {
  console.log("Could not find data D!");
  process.exit(1);
}

const data = JSON.parse(match[1]);
const targetId = '1:4181:@root/container[0]/hugeiconsrefresh-03-stroke-rounded-1[0]';
const track = data.tracks.find(t => t.id === targetId);

if (track) {
  console.log(`Track: ${track.id}`);
  console.log(`Tag: ${track.tag}`);
  console.log(`Present:`, JSON.stringify(track.present));
  console.log(`Rotations:`, JSON.stringify(track.rotations));
  console.log(`Transforms:`, JSON.stringify(track.transforms));
} else {
  console.log("Track not found!");
}
