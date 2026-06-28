const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

console.log('Schema:', manifest.schema);
console.log('States count:', manifest.states ? manifest.states.length : 0);
if (manifest.states) {
  manifest.states.forEach((s, idx) => {
    console.log(`  State ${idx}: ID: ${s.id}, Name: ${s.name}`);
  });
}

console.log('\nPrototype object keys:', manifest.prototype ? Object.keys(manifest.prototype) : 'none');
if (manifest.prototype) {
  console.log('Start State ID:', manifest.prototype.startStateId);
  console.log('Reactions count:', manifest.prototype.reactions ? manifest.prototype.reactions.length : 0);
  if (manifest.prototype.reactions) {
    manifest.prototype.reactions.forEach((r, idx) => {
      console.log(`  Reaction ${idx}:`);
      console.log(`    ID: ${r.id}`);
      console.log(`    Trigger: ${JSON.stringify(r.trigger)}`);
      console.log(`    Actions: ${JSON.stringify(r.actions)}`);
    });
  }
}
