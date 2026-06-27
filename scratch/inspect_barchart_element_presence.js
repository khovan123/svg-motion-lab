const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgStr = fs.readFileSync('dist/animation.svg', 'utf8');
const { window } = new JSDOM(svgStr, { contentType: 'image/svg+xml' });
const doc = window.document;

console.log("All elements with background or active in data-motion-id:");
doc.querySelectorAll('*').forEach(el => {
  const id = el.getAttribute('data-motion-id') || '';
  if (id.includes('bar-chart') && (id.includes('background') || id.includes('active'))) {
    console.log(`- Tag=${el.tagName}, ID=${id}`);
    console.log(`  attributes: fill="${el.getAttribute('fill') || ''}", opacity="${el.getAttribute('opacity') || ''}", visibility="${el.getAttribute('visibility') || ''}"`);
    // If it is inside a clip-path or group, print the parent
    if (el.parentElement) {
      console.log(`  parent: Tag=${el.parentElement.tagName}, ID=${el.parentElement.getAttribute('data-motion-id') || 'none'}, clip-path="${el.parentElement.getAttribute('clip-path') || ''}"`);
    }
  }
});

// Also print the track data from script
const scriptEl = doc.querySelector('script');
const scriptText = scriptEl ? scriptEl.textContent : '';
const match = scriptText.match(/const D=(.*?),\s*svg=/);
if (match) {
  const D = JSON.parse(match[1]);
  console.log("\nTrack presence in runtime D:");
  D.tracks.forEach(track => {
    if (track.id.includes('bar-chart') && (track.id.includes('background') || track.id.includes('active'))) {
      console.log(`Track: ${track.id}`);
      console.log(`  present: [${track.present.join(', ')}]`);
      if (track.numeric && track.numeric.some(n => n.opacity != null)) {
        console.log(`  opacity values:`, track.numeric.map(n => n.opacity));
      }
    }
  });
}
