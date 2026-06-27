const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

console.log("=== PROTO FLOWS ===");
if (manifest.prototype && manifest.prototype.flowStartingPoints) {
  console.log("Flows:", manifest.prototype.flowStartingPoints);
}

console.log("\n=== PROTO REACTIONS ===");
if (manifest.prototype && manifest.prototype.reactions) {
  manifest.prototype.reactions.forEach((r, idx) => {
    console.log(`\nReaction ${idx}:`);
    console.log(`  Source State:  ${r.sourceStateId}`);
    console.log(`  Source Layer:  ${r.sourceLayerKey || r.sourceNodeId}`);
    console.log(`  Trigger:       ${JSON.stringify(r.trigger)}`);
    console.log(`  Actions:       ${JSON.stringify(r.actions)}`);
  });
}
