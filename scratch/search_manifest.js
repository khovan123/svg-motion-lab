const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

console.log("Searching for 15:982...");
if (JSON.stringify(manifest).includes("15:982")) {
  console.log("Found 15:982 in JSON representation");
} else {
  console.log("15:982 NOT found");
}

console.log("Searching for 15-982...");
if (JSON.stringify(manifest).includes("15-982")) {
  console.log("Found 15-982 in JSON representation");
} else {
  console.log("15-982 NOT found");
}

console.log("Searching for 1:4565...");
if (JSON.stringify(manifest).includes("1:4565")) {
  console.log("Found 1:4565 in JSON representation");
} else {
  console.log("1:4565 NOT found");
}

// Check all layer IDs that are in state 0
console.log("State 0 layers count:", manifest.states[0].layers.length);
console.log("State 0 layers first 10:");
manifest.states[0].layers.slice(0, 10).forEach(l => {
  console.log(` - ID: ${l.id}, stableNodeId: ${l.stableNodeId}, Name: ${l.name}`);
});
