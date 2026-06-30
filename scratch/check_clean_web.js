const fs = require('fs');
const { execSync } = require('child_process');

console.log('Resetting web/semantic-15.js...');
execSync('git checkout web/semantic-15.js');

const code = fs.readFileSync('web/semantic-15.js', 'utf8');
const occurrences = (code.match(/originalIds/g) || []).length;
console.log('Occurrences of originalIds in clean web/semantic-15.js:', occurrences);

// Let's print the lines containing it
const lines = code.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('originalIds')) {
    console.log(`  Line ${idx + 1}: ${line}`);
  }
});
