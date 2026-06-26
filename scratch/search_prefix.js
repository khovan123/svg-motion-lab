const fs = require('fs');
const content = fs.readFileSync('motion-manifest.json', 'utf8');

const regex = /"\d+:\d+[^"]*"/g;
const matches = content.match(regex) || [];
const uniquePrefixes = new Set();

matches.forEach(m => {
  const parts = m.replace(/"/g, '').split(':');
  if (parts.length > 0) {
    uniquePrefixes.add(parts[0]);
  }
});

console.log("Unique numeric ID prefixes in manifest:", [...uniquePrefixes]);

// Let's also print the first 100 characters of the first state SVG to see if there is any other prefix
const manifest = JSON.parse(content);
console.log("Manifest schema:", manifest.schema);
console.log("State names:", manifest.states.map(s => s.name));
