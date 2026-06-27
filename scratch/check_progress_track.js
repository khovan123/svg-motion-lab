const fs = require('fs');
const svg = fs.readFileSync('dist/animation.svg', 'utf8');

const jsonMatch = svg.match(/const D=(\{[\s\S]*?\}),svg/);
if (jsonMatch) {
  const data = JSON.parse(jsonMatch[1]);
  console.log("Numeric properties animated globally:", data.numeric);
  const track = data.tracks.find(t => t.id.includes('doc-icon[0]/background[0]'));
  if (track) {
    console.log("Found track for progress bar background:", track.id);
    console.log("Tag:", track.tag);
    console.log("Numeric tracks values:", JSON.stringify(track.numeric, null, 2));
    console.log("paths:", JSON.stringify(track.paths, null, 2));
    console.log("pathMode:", track.pathMode);
  } else {
    console.log("Track for progress bar background NOT found!");
  }
} else {
  console.log("Could not parse JSON data from SVG!");
}
