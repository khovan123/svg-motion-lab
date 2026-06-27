const fs = require('fs');
const { JSDOM } = require('jsdom');

const svg = fs.readFileSync('dist-test-manifest1/animation.svg', 'utf8');
const doc = new JSDOM(svg, { contentType: 'image/svg+xml' }).window.document;

const script = doc.querySelector('script');
const scriptText = script.textContent;

// Extract the tracks data
// Find the D= assignment
const dMatch = scriptText.match(/const D=(\{[\s\S]*?\});/);
if (!dMatch) {
  console.log('Could not find D= assignment');
  // Try another pattern
  const altMatch = scriptText.match(/const D=([\s\S]*?)\nconst/);
  console.log('Alt match:', altMatch ? 'found' : 'not found');
  process.exit(1);
}

// Parse D
try {
  // The D object might be very long, so let's just extract and eval it
  const dStr = dMatch[1];
  const D = eval('(' + dStr + ')');
  
  console.log(`Duration: ${D.duration}`);
  console.log(`Infinite: ${D.infinite}`);
  console.log(`Segments: ${D.segments.length}`);
  for (const seg of D.segments) {
    console.log(`  from=${seg.from} to=${seg.to} start=${seg.start} end=${seg.end} (duration=${(seg.end-seg.start).toFixed(3)})`);
  }
  
  console.log(`\nTracks: ${D.tracks.length}`);
  
  // Find progress bar related tracks
  for (const track of D.tracks) {
    if (track.id.includes('bar') || track.id.includes('active') || track.id.includes('number')) {
      console.log(`\n  Track: "${track.id}"`);
      console.log(`    tag: ${track.tag}`);
      console.log(`    baseIndex: ${track.baseIndex}`);
      console.log(`    present: ${JSON.stringify(track.present)}`);
      console.log(`    numeric: ${JSON.stringify(track.numeric)}`);
      console.log(`    colors: ${JSON.stringify(track.colors)}`);
      if (track.paths) console.log(`    paths: ${track.paths.length} paths`);
      if (track.pathMode !== undefined) console.log(`    pathMode: ${track.pathMode}`);
      // Show all other keys
      const knownKeys = new Set(['id','baseIndex','tag','present','numeric','colors','paths','pathMode']);
      const otherKeys = Object.keys(track).filter(k => !knownKeys.has(k));
      for (const k of otherKeys) {
        const val = JSON.stringify(track[k]);
        console.log(`    ${k}: ${val ? val.substring(0, 200) : val}`);
      }
    }
  }
  
  // Also show all track IDs for context
  console.log('\n\nAll track IDs:');
  for (const track of D.tracks) {
    console.log(`  "${track.id}" tag=${track.tag} pathMode=${track.pathMode} numericKeys=[${Object.keys(track.numeric[0] || {}).join(',')}]`);
  }
  
} catch(e) {
  console.error('Error parsing D:', e.message);
}
