const fs = require('fs');

const testPatch = fs.readFileSync('scratch/test_patch.js', 'utf8');
const occurrences = (testPatch.match(/insertTarget \+ insertion/g) || []).length;
console.log('Occurrences of insertTarget + insertion in scratch/test_patch.js:', occurrences);
