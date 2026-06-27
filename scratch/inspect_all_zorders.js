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
  console.log("Track Z-Orders in State 0:");
  const list = D.tracks.map(t => ({
    id: t.id,
    z: t.zOrder ? t.zOrder[0] : null
  })).filter(t => t.z !== null).sort((a,b) => a.z - b.z);
  
  list.forEach(item => {
    console.log(`- z=${item.z}: ${item.id}`);
  });
}
