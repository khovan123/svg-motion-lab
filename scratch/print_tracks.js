const fs = require('fs');
const { JSDOM } = require('jsdom');

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const doc = new JSDOM(svg, { contentType: 'image/svg+xml' }).window.document;
const scriptEl = doc.querySelector('script');
const scriptText = scriptEl ? scriptEl.textContent : '';

// Find where D = {...} starts
const startIdx = scriptText.indexOf('const D={');
if (startIdx !== -1) {
  // Let's find the matching }
  let openBraces = 0;
  let endIdx = -1;
  for (let i = startIdx + 8; i < scriptText.length; i++) {
    if (scriptText[i] === '{') openBraces++;
    else if (scriptText[i] === '}') {
      if (openBraces === 0) {
        endIdx = i;
        break;
      }
      openBraces--;
    }
  }
  if (endIdx !== -1) {
    const jsonStr = scriptText.substring(startIdx + 8, endIdx + 1);
    try {
      const D = JSON.parse(jsonStr);
      console.log("Tracks in SVG:");
      D.tracks.forEach(t => {
        console.log(`- ID: "${t.id}" | tag: "${t.tag}" | present: ${JSON.stringify(t.present)}`);
      });
    } catch (e) {
      console.error("JSON parse error:", e);
    }
  } else {
    console.log("Matching brace not found");
  }
} else {
  console.log("No D object found in script!");
}
