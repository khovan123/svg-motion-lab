const fs = require('fs');
const { JSDOM } = require('jsdom');

const svg = fs.readFileSync('dist-test-manifest1/animation.svg', 'utf8');
const doc = new JSDOM(svg, { contentType: 'image/svg+xml' }).window.document;

const script = doc.querySelector('script');
if (!script) {
  console.log('No script found!');
  process.exit(1);
}

const scriptText = script.textContent;

// Search for 'active' in the script
const activeMatches = scriptText.match(/active/gi);
console.log(`'active' occurrences: ${activeMatches ? activeMatches.length : 0}`);

// Search for 'bar' in the script
const barMatches = scriptText.match(/bar/gi);
console.log(`'bar' occurrences: ${barMatches ? barMatches.length : 0}`);

// Search for 'number' in the script
const numberMatches = scriptText.match(/number/gi);
console.log(`'number' occurrences: ${numberMatches ? numberMatches.length : 0}`);

// Search for width-related track data
const widthMatches = scriptText.match(/width/gi);
console.log(`'width' occurrences: ${widthMatches ? widthMatches.length : 0}`);

// Look for the controller/tracks data structure
// Try to find tracks array
const tracksMatch = scriptText.match(/(tracks|controller)\s*[:=]/g);
console.log(`\nTrack/controller references: ${JSON.stringify(tracksMatch)}`);

// Look for scaleX or transform-related
const scaleMatches = scriptText.match(/scaleX|transform|translate/gi);
console.log(`Scale/transform references: ${scaleMatches ? scaleMatches.length : 0}`);

// Extract the whole g elements with data-track attributes
const gElements = doc.querySelectorAll('g[data-track], g[data-layer]');
console.log(`\nGroups with data-track: ${gElements.length}`);
for (const g of gElements) {
  console.log(`  id="${g.id}" data-track="${g.getAttribute('data-track')}" data-layer="${g.getAttribute('data-layer')}"`);
}

// Look for rect elements that could be the progress bar
const rects = doc.querySelectorAll('rect');
console.log(`\nAll rects:`);
for (const r of rects) {
  const parent = r.parentElement;
  const parentId = parent ? parent.id || parent.tagName : 'none';
  console.log(`  w=${r.getAttribute('width')} h=${r.getAttribute('height')} fill=${r.getAttribute('fill')} rx=${r.getAttribute('rx')} parent=${parentId}`);
}

// Check for any group IDs that mention progress/bar/active
const allGs = doc.querySelectorAll('g');
console.log(`\nAll <g> IDs:`);
for (const g of allGs) {
  if (g.id) console.log(`  "${g.id}"`);
}

// Look at the start of the script to understand the data structure
console.log(`\n\nScript first 2000 chars:`);
console.log(scriptText.substring(0, 2000));
