const fs = require('fs');

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const match = svg.match(/const D=(\{[\s\S]*?\}),svg/);
if (!match) {
  console.log("Could not find data D!");
  process.exit(1);
}

const data = JSON.parse(match[1]);
console.log("=== PIE CHART TRACKS ===");
const pieTracks = data.tracks.filter(t => t.id.includes('piechart'));
pieTracks.forEach(t => {
  console.log(`Track ID: ${t.id}`);
  console.log(`  tag: ${t.tag}`);
  console.log(`  pathMode: ${t.pathMode}`);
  const hasColorAnim = t.colors.some(c => Object.keys(c).length > 0);
  const hasRotAnim = t.rotations.some(r => r && r.angle !== 0);
  console.log(`  hasColorAnim: ${hasColorAnim}`);
  console.log(`  hasRotAnim: ${hasRotAnim}`);
  if (hasRotAnim) {
    console.log(`  rotations sample:`, JSON.stringify(t.rotations.slice(0, 4)));
  }
});
