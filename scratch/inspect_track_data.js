const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgContent = fs.readFileSync('dist/animation.svg', 'utf8');
const doc = new JSDOM(svgContent, { contentType: 'image/svg+xml' }).window.document;

const script0 = doc.querySelectorAll('script')[0].textContent;
const match = script0.match(/const D=(\{.*\}),svg/);
if (match) {
  const data = JSON.parse(match[1]);
  const track = data.tracks.find(t => t.id.includes('hugeiconsrefresh-03-stroke-rounded-1'));
  console.log("Track in Script 0:", JSON.stringify(track, null, 2));
} else {
  console.log("Could not parse D from script0");
}
