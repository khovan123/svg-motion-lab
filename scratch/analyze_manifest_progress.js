const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

console.log(`Schema: ${manifest.schema}`);
console.log(`States: ${manifest.states.length}`);

manifest.states.forEach((state, idx) => {
  console.log(`\n--- State ${idx}: ${state.name} (id: ${state.id}) ---`);
  console.log(`  Layers: ${state.layers.length}`);
  console.log(`  Width: ${state.width}, Height: ${state.height}`);
  
  // Find progress-bar related layers
  const progressLayers = state.layers.filter(l => {
    const name = (l.name || '').toLowerCase();
    const key = (l.key || '').toLowerCase();
    return name.includes('progress') || name.includes('bar') || 
           name.includes('indicator') || name.includes('track') ||
           key.includes('progress') || key.includes('bar');
  });
  
  if (progressLayers.length > 0) {
    console.log(`  Progress-related layers: ${progressLayers.length}`);
    for (const l of progressLayers) {
      console.log(`    - "${l.name}" key=${l.key} type=${l.type}`);
      console.log(`      x=${l.x} y=${l.y} w=${l.width} h=${l.height} opacity=${l.opacity}`);
      if (l.fills) console.log(`      fills=${JSON.stringify(l.fills).substring(0, 200)}`);
      if (l.children) console.log(`      children: ${l.children.length}`);
    }
  }
});

// Check prototype
if (manifest.prototype) {
  console.log(`\n\nPrototype reactions: ${manifest.prototype.reactions.length}`);
  manifest.prototype.reactions.forEach((r, i) => {
    console.log(`  Reaction ${i}: trigger=${r.trigger && r.trigger.type} action=${r.action && r.action.type} from=${r.fromStateId} to=${r.toStateId || (r.action && r.action.targetStateId)}`);
  });
}
