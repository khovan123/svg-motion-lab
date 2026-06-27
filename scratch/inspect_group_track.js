const fs = require('fs');
const { JSDOM } = require('jsdom');

const htmlContent = fs.readFileSync('dist/animation.html', 'utf8');
const dom = new JSDOM(htmlContent);
const { document } = dom.window;

const script = document.querySelector('#motion-svg script');
const code = script ? script.textContent : '';

const match = code.match(/const D=(\{.*\}),svg/);
if (match) {
  const D = JSON.parse(match[1]);
  const groupTrack = D.tracks.find(t => t.id === '1:4181:@root/container[0]/hugeiconsrefresh-03-stroke-rounded-1[0]');
  console.log("Group track:");
  console.log(JSON.stringify(groupTrack, null, 2));
} else {
  console.log("Could not find runtime data!");
}
