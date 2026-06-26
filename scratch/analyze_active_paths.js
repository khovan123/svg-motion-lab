const fs = require('fs');

const svg = fs.readFileSync('dist-test-manifest1/animation.svg', 'utf8');

// Extract the D data  
const scriptMatch = svg.match(/<script[^>]*>([\s\S]*?)<\/script>/);
const scriptText = scriptMatch[1];

// Find the D= and extract by brace matching
const startIdx = scriptText.indexOf('const D=') + 8;
let braceDepth = 0;
let endIdx = startIdx;
for (let i = startIdx; i < scriptText.length; i++) {
  if (scriptText[i] === '{') braceDepth++;
  if (scriptText[i] === '}') braceDepth--;
  if (braceDepth === 0) {
    endIdx = i + 1;
    break;
  }
}
const dStr = scriptText.substring(startIdx, endIdx);
const D = JSON.parse(dStr);

// Find active track
const activeTrack = D.tracks.find(t => t.id.includes('active'));
if (!activeTrack) {
  console.log('No active track found!');
  process.exit(1);
}

console.log('Active Track Analysis:');
console.log(`  pathMode: ${activeTrack.pathMode}`);
console.log(`  tag: ${activeTrack.tag}`);

// Check path compatibility
function tokenizePath(d) {
  return String(d || '').match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
}
function pathTemplate(d) {
  const tokens = tokenizePath(d);
  const commands = tokens.filter(x => /^[a-zA-Z]$/.test(x));
  const numbers = tokens.filter(x => !/^[a-zA-Z]$/.test(x)).map(Number);
  return { commands: commands.join(''), numbers };
}

console.log('\nPath details per state:');
for (let i = 0; i < activeTrack.paths.length; i++) {
  const p = activeTrack.paths[i];
  if (p) {
    const t = pathTemplate(p);
    console.log(`  paths[${i}]: commands="${t.commands}" numCount=${t.numbers.length} pathLen=${p.length}`);
    console.log(`    path: "${p}"`);
  } else {
    console.log(`  paths[${i}]: null`);
  }
}

// Check compatibility
const valid = activeTrack.paths.filter(Boolean);
const first = pathTemplate(valid[0]);
const allCompat = valid.every(p => {
  const t = pathTemplate(p);
  return t.commands === first.commands && t.numbers.length === first.numbers.length;
});
console.log(`\nPaths compatible: ${allCompat}`);

// Also check the "number" track
const numTrack = D.tracks.find(t => t.id.includes('number'));
console.log('\n\nNumber Track Analysis:');
console.log(`  pathMode: ${numTrack.pathMode}`);
console.log(`  tag: ${numTrack.tag}`);
for (let i = 0; i < numTrack.paths.length; i++) {
  const p = numTrack.paths[i];
  if (p) {
    const t = pathTemplate(p);
    console.log(`  paths[${i}]: commands="${t.commands}" numCount=${t.numbers.length} pathLen=${p.length}`);
  }
}

// Also check the "bar" track
const barTrack = D.tracks.find(t => t.id.includes('bar'));
console.log('\n\nBar Track Analysis:');
console.log(`  pathMode: ${barTrack.pathMode}`);
console.log(`  tag: ${barTrack.tag}`);
for (let i = 0; i < barTrack.paths.length; i++) {
  const p = barTrack.paths[i];
  if (p) {
    const t = pathTemplate(p);
    console.log(`  paths[${i}]: commands="${t.commands}" numCount=${t.numbers.length} pathLen=${p.length}`);
  }
}
