const fs = require('fs');
const lines = fs.readFileSync('scratch/semantic-15.js', 'utf8').split('\n');
lines.forEach((line, idx) => {
  if (line.includes('originalIds')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
