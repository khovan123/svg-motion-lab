const fs = require('fs');
const { execSync } = require('child_process');

console.log('Copying scratch/semantic-15.js to web/semantic-15.js...');
fs.copyFileSync('scratch/semantic-15.js', 'web/semantic-15.js');

console.log('Copying scratch/semantic-13.js to web/semantic-13.js...');
fs.copyFileSync('scratch/semantic-13.js', 'web/semantic-13.js');

console.log('Copying scratch/semantic-14.js to web/semantic-14.js...');
fs.copyFileSync('scratch/semantic-14.js', 'web/semantic-14.js');

console.log('Running node compile.js...');
try {
  execSync('node compile.js', { stdio: 'inherit' });
} catch (e) {
  console.error('compile.js failed:', e);
  process.exit(1);
}

console.log('Running node scratch/compare_tracks_patched.js...');
try {
  execSync('node scratch/compare_tracks_patched.js', { stdio: 'inherit' });
} catch (e) {
  process.exit(1);
}
