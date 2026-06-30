const fs = require('fs');
const { JSDOM } = require('jsdom');

function getTracks(filePath) {
  const svg = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(svg);
  const doc = dom.window.document;
  const scripts = doc.querySelectorAll('script');
  let runtimeScript = null;
  scripts.forEach(s => {
    if (s.textContent.includes('D.tracks')) {
      runtimeScript = s.textContent;
    }
  });

  if (!runtimeScript) return [];
  const startIdx = runtimeScript.indexOf('const D=');
  if (startIdx < 0) return [];
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
  if (jsonEnd < 0) return [];
  const json = runtimeScript.slice(jsonStart, jsonEnd);
  const D = JSON.parse(json);
  return D.tracks.map(t => t.id);
}

const verifyTracks = getTracks('verify-z-c1/animation.svg');
const distTracks = getTracks('dist/animation.svg');

console.log('Verify runtime tracks count:', verifyTracks.length);
console.log('Dist runtime tracks count:', distTracks.length);

console.log('\nTracks in Verify but not in Dist:');
verifyTracks.forEach(t => {
  if (!distTracks.includes(t)) console.log('  ', t);
});

console.log('\nTracks in Dist but not in Verify:');
distTracks.forEach(t => {
  if (!verifyTracks.includes(t)) console.log('  ', t);
});
