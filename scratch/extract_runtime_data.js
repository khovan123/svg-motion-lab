const fs = require('fs');
const svg = fs.readFileSync('dist/animation.svg', 'utf8');

const match = svg.match(/const D=(\{.*?\})(?:,svg|;)/);
if (!match) {
  console.log("Could not find const D in SVG script");
  process.exit(1);
}

const data = JSON.parse(match[1]);
console.log(`Duration: ${data.duration}, Infinite: ${data.infinite}`);
console.log(`Total tracks: ${data.tracks.length}`);
data.tracks.forEach((t, i) => {
  const presentStates = t.present.map((p, idx) => p ? idx : null).filter(v => v !== null);
  console.log(`[Track ${i}] ID: ${t.id}, Tag: ${t.tag}, Present in states: [${presentStates.join(', ')}], PathMode: ${t.pathMode}`);
});
