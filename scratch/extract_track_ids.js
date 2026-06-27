const fs = require('fs');
const { JSDOM } = require('jsdom');

const svg = fs.readFileSync('dist-test-manifest1/animation.svg', 'utf8');
const dom = new JSDOM(svg, { contentType: 'image/svg+xml', runScripts: 'dangerously' });
const doc = dom.window.document;

// The script might set up a controller. Let's check what's available
const script = doc.querySelector('script');
const scriptText = script.textContent;

// Find all track IDs by regex
const trackIdRegex = /"id":"([^"]+)"/g;
let match;
const trackIds = [];
while ((match = trackIdRegex.exec(scriptText)) !== null) {
  if (!trackIds.includes(match[1])) {
    trackIds.push(match[1]);
  }
}

console.log('All unique track IDs:');
for (const id of trackIds) {
  console.log(`  "${id}"`);
}

// Search specifically for the Active and Bar tracks
console.log('\n\n--- Searching for active/bar/number tracks ---');
for (const id of trackIds) {
  if (id.includes('active') || id.includes('bar') || id.includes('number')) {
    console.log(`FOUND: "${id}"`);
  }
}

// Check if there's a width property being animated
// Look for numeric properties in tracks that mention width
const widthContext = [];
let idx = 0;
while ((idx = scriptText.indexOf('"width"', idx)) !== -1) {
  const contextStart = Math.max(0, idx - 200);
  const contextEnd = Math.min(scriptText.length, idx + 200);
  widthContext.push(scriptText.substring(contextStart, contextEnd));
  idx += 7;
}
console.log(`\n\nWidth contexts found: ${widthContext.length}`);
for (const ctx of widthContext) {
  console.log(`---\n${ctx}\n---`);
}
