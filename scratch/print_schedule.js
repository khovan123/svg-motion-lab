const fs = require('fs');
const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const match = svg.match(/const D=(\{[\s\S]*?\}),svg/);
const data = JSON.parse(match[1]);

console.log("Total duration:", data.duration);
console.log("\nSegments in schedule:");
data.segments.forEach((seg, idx) => {
  console.log(`  Segment ${idx}: from State ${seg.from} to State ${seg.to} (start=${seg.start}s, end=${seg.end}s)`);
});
