const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgStr = fs.readFileSync('dist/animation.svg', 'utf8');
const { window } = new JSDOM(svgStr, { contentType: 'image/svg+xml' });
const doc = window.document;

const scriptEl = doc.querySelector('script');
const scriptText = scriptEl ? scriptEl.textContent : '';
const match = scriptText.match(/const D=(.*?),\s*svg=/);
if (!match) {
  console.log("Could not find data D!");
  process.exit(1);
}
const D = JSON.parse(match[1]);

console.log("=== Active columns tracks ===");
D.tracks.forEach(track => {
  if (track.id.includes('bar-chart') && track.id.includes('active')) {
    console.log(`Track ID: ${track.id}`);
    console.log(`  present: [${track.present.join(', ')}]`);
    console.log(`  numeric opacities:`, track.numeric.map(n => n['opacity'] !== undefined ? n['opacity'] : 'undefined'));
    console.log(`  fill-opacity:`, track.numeric.map(n => n['fill-opacity'] !== undefined ? n['fill-opacity'] : 'undefined'));
  }
});
