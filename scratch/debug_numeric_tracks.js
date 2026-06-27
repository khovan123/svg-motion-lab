const fs = require('fs');
const path = require('path');

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const match = svg.match(/const D=(\{[\s\S]*?\}),svg/);
if (!match) {
  console.log("Could not find data D!");
  process.exit(1);
}

const data = JSON.parse(match[1]);
const targetId = '1:4181:@root/bar-chart[0]/2nd-column[0]/background[0]';
const track = data.tracks.find(t => t.id === targetId);

if (track) {
  console.log(`Track: ${track.id}`);
  console.log(`Numeric keys in track:`);
  track.numeric.forEach((n, idx) => {
    console.log(`  State ${idx}:`, JSON.stringify(n));
  });
} else {
  console.log("Track not found!");
}
