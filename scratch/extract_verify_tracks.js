const fs = require('fs');
const { JSDOM } = require('jsdom');

const verifySvg = fs.readFileSync('verify-z-c1/animation.svg', 'utf8');
const dom = new JSDOM(verifySvg);
const doc = dom.window.document;
const scripts = doc.querySelectorAll('script');
scripts.forEach(script => {
  const text = script.textContent;
  const match = text.match(/const D=(\{.*\}),svg=/);
  if (match) {
    const data = JSON.parse(match[1]);
    console.log('Tracks in verify-z-c1 script runtime data:');
    data.tracks.forEach(t => console.log('  ', t.id));
  }
});
