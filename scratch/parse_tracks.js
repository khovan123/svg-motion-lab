const fs = require('fs');

const svg = fs.readFileSync('dist-test-manifest1/animation.svg', 'utf8');

// Find the script content
const scriptMatch = svg.match(/<script[^>]*>([\s\S]*?)<\/script>/);
if (!scriptMatch) { console.log('No script'); process.exit(1); }
const scriptText = scriptMatch[1];

// Parse the D object using eval in a sandboxed way
const dMatch = scriptText.match(/const D=(\{[\s\S]+?\});(?:\s*const|\s*function|\s*\/\/)/);
if (!dMatch) {
  // Try to extract just up to the first semicolon after closing brace
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
  
  try {
    const D = JSON.parse(dStr);
    analyzeD(D);
  } catch(e) {
    console.log('Failed to parse D:', e.message);
    console.log('D string length:', dStr.length);
    console.log('D string first 500:', dStr.substring(0, 500));
  }
} else {
  try {
    const D = JSON.parse(dMatch[1]);
    analyzeD(D);
  } catch(e) {
    console.log('JSON parse failed, trying eval');
  }
}

function analyzeD(D) {
  console.log(`Duration: ${D.duration}`);
  console.log(`Tracks: ${D.tracks.length}`);
  console.log(`Segments: ${D.segments.length}`);
  
  for (const seg of D.segments) {
    console.log(`  Segment: from=${seg.from} to=${seg.to} start=${seg.start.toFixed(3)} end=${seg.end.toFixed(3)} dur=${(seg.end-seg.start).toFixed(3)}`);
  }
  
  console.log('\n--- Progress Bar Tracks ---');
  for (const track of D.tracks) {
    if (track.id.includes('bar') || track.id.includes('active') || track.id.includes('number')) {
      console.log(`\nTrack: "${track.id}"`);
      console.log(`  tag: ${track.tag}`);
      console.log(`  pathMode: ${track.pathMode}`);
      console.log(`  present: ${JSON.stringify(track.present)}`);
      
      // Show numeric properties per state
      if (track.numeric) {
        for (let i = 0; i < track.numeric.length; i++) {
          const keys = Object.keys(track.numeric[i] || {});
          if (keys.length) {
            console.log(`  numeric[${i}]: ${JSON.stringify(track.numeric[i])}`);
          } else {
            console.log(`  numeric[${i}]: {} (empty)`);
          }
        }
      }
      
      // Show color properties per state
      if (track.colors) {
        for (let i = 0; i < track.colors.length; i++) {
          console.log(`  colors[${i}]: ${JSON.stringify(track.colors[i])}`);
        }
      }
      
      // Show paths
      if (track.paths) {
        for (let i = 0; i < track.paths.length; i++) {
          const p = track.paths[i];
          console.log(`  paths[${i}]: length=${p ? p.length : 'null'} start="${p ? p.substring(0, 80) : 'null'}..."`);
        }
      }
    }
  }
}
