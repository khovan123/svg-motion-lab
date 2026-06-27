const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgText = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svgText);
const doc = dom.window.document;

// Let's find all tracks inside the script
const script = doc.querySelector('script');
if (script) {
  const content = script.textContent;
  const match = content.match(/const D=(\{.*\}),svg/);
  if (match) {
    const data = JSON.parse(match[1]);
    console.log(`Total duration: ${data.duration}`);
    console.log(`Tracks count: ${data.tracks.length}`);
    
    data.tracks.forEach(track => {
      console.log(`\nTrack ID: ${track.id} (tag: ${track.tag}, pathMode: ${track.pathMode})`);
      // Display transitions or keyframe values
      if (track.transforms) {
        console.log(`  Transforms:`, JSON.stringify(track.transforms.map(t => t ? t.slice(4) : null))); // Show just dx/dy/sx/sy
      }
      if (track.opacities) {
        console.log(`  Opacities:`, JSON.stringify(track.opacities));
      }
      if (track.paths) {
        console.log(`  Paths defined: ${track.paths.filter(Boolean).length} / ${track.paths.length}`);
      }
    });
  } else {
    console.log('Could not find data in script!');
  }
} else {
  console.log('No script element found!');
}
