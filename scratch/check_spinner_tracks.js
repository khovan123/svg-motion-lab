const fs = require('fs');
const { JSDOM } = require('jsdom');

const htmlContent = fs.readFileSync('dist/animation.html', 'utf8');
const dom = new JSDOM(htmlContent);
const { document } = dom.window;

// Find script 0 text content
const script = document.querySelector('#motion-svg script');
const code = script ? script.textContent : '';

// Find the D = {...} JSON inside the code
const match = code.match(/const D=(\{.*\}),svg/);
if (match) {
  const D = JSON.parse(match[1]);
  console.log("Total tracks in Script 0:", D.tracks.length);
  const spinnerTracks = D.tracks.filter(t => t.id.includes('hugeiconsrefresh-03-stroke-rounded-1'));
  console.log("Spinner tracks in Script 0:");
  console.log(JSON.stringify(spinnerTracks, null, 2));
} else {
  console.log("Could not find runtime data in Script 0!");
}
