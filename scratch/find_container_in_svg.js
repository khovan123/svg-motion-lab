const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state = manifest.states[0];
const lines = state.svg.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('container[0]')) {
    console.log(`${idx + 1}: ${line}`);
    // Also print 3 lines before and 3 lines after
    for (let i = Math.max(0, idx - 3); i <= Math.min(lines.length - 1, idx + 3); i++) {
      console.log(`  [${i + 1}]: ${lines[i]}`);
    }
  }
});
