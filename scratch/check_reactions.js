const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

console.log("Start state:", manifest.prototype.startStateId);
console.log("Reactions:");
manifest.prototype.reactions.forEach((r, idx) => {
  console.log(`Reaction ${idx}: trigger = ${JSON.stringify(r.trigger)}, actions = ${JSON.stringify(r.actions)}`);
});
