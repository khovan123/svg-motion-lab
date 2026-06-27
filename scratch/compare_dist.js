const fs = require('fs');

// Check what manifest was used to generate current dist
const distSvg = fs.readFileSync('dist/animation.svg', 'utf8');
const testSvg = fs.readFileSync('dist-test-manifest1/animation.svg', 'utf8');

console.log('dist/animation.svg size:', distSvg.length);
console.log('dist-test-manifest1/animation.svg size:', testSvg.length);
console.log('Are they the same:', distSvg === testSvg);

// Check duration from each
const distDuration = distSvg.match(/data-duration="([^"]+)"/);
const testDuration = testSvg.match(/data-duration="([^"]+)"/);
console.log('dist duration:', distDuration ? distDuration[1] : 'not found');
console.log('test duration:', testDuration ? testDuration[1] : 'not found');

// Check which manifest was last used
const distTrackIds = new Set();
const re = /"id":"([^"]+)"/g;
let m;
while ((m = re.exec(distSvg)) !== null) distTrackIds.add(m[1]);

console.log('\nDist track IDs:');
for (const id of distTrackIds) console.log(`  ${id}`);
