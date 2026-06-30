const fs = require('fs');

const code = fs.readFileSync('web/semantic-15.js', 'utf8').replace(/\r\n/g, '\n');
const insertTarget = 'function canonicalizeManifest(manifest){\n  const seenIds = new Set();\n  const uniqueStates = [];\n  for (const s of (manifest.states || [])) {\n    if (!seenIds.has(s.id)) {\n      seenIds.add(s.id);\n      uniqueStates.push(s);\n    }\n  }\n  manifest.states = uniqueStates;';

const occurrences = (code.split(insertTarget).length - 1);
console.log('Occurrences of insertTarget in clean web/semantic-15.js:', occurrences);
