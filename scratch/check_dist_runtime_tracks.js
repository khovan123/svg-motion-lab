const fs = require('fs');
const { JSDOM } = require('jsdom');

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svg);
const doc = dom.window.document;

const scripts = doc.querySelectorAll('script');
let runtimeScript = null;
scripts.forEach(s => {
  if (s.textContent.includes('D.tracks')) {
    runtimeScript = s.textContent;
  }
});

if (runtimeScript) {
  const startIdx = runtimeScript.indexOf('const D=');
  if (startIdx >= 0) {
    let braceCount = 0;
    let jsonStart = startIdx + 8;
    let jsonEnd = -1;
    for (let i = jsonStart; i < runtimeScript.length; i++) {
      if (runtimeScript[i] === '{') {
        braceCount++;
      } else if (runtimeScript[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          jsonEnd = i + 1;
          break;
        }
      }
    }
    if (jsonEnd > 0) {
      const json = runtimeScript.slice(jsonStart, jsonEnd);
      const D = JSON.parse(json);
      console.log('Dist runtime tracks count:', D.tracks.length);
      console.log('Dist runtime tracks IDs:');
      D.tracks.forEach(t => console.log('  ', t.id));
    }
  }
}
