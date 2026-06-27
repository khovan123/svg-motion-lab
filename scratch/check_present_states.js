const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgText = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svgText);
const doc = dom.window.document;

const script = doc.querySelector('script');
if (script) {
  const content = script.textContent;
  const match = content.match(/const D=(\{.*\}),svg/);
  if (match) {
    const data = JSON.parse(match[1]);
    data.tracks.forEach(track => {
      if (track.id.includes('text') || track.id.includes('avatar') || track.id.includes('card')) {
        console.log(`Track: ${track.id}`);
        console.log(`  present: ${JSON.stringify(track.present.map(v => v ? 1 : 0))}`);
      }
    });
  }
}
