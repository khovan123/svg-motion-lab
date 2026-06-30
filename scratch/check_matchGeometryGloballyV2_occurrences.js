const fs = require('fs');
const { execSync } = require('child_process');

execSync('git checkout web/semantic-15.js');
const code = fs.readFileSync('web/semantic-15.js', 'utf8');
const occurrences = (code.match(/function matchGeometryGloballyV2/g) || []).length;
console.log('Occurrences of function matchGeometryGloballyV2 in clean web/semantic-15.js:', occurrences);
