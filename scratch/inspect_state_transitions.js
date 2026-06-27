const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

console.log("Transitions between states in Figma manifest:");
manifest.prototype.reactions.forEach((r, idx) => {
  const trigger = r.trigger || {};
  const action = r.actions && r.actions[0] || {};
  
  const fromState = manifest.states.find(s => s.id === r.sourceStateId);
  const toState = manifest.states.find(s => s.id === action.destinationStateId);
  
  if (fromState && toState) {
    console.log(`\nReaction ${idx}:`);
    console.log(`  From: "${fromState.name}" (${fromState.id})`);
    console.log(`  To: "${toState.name}" (${toState.id})`);
    console.log(`  Trigger: ${trigger.type || 'unknown'}`);
    console.log(`  Transition: ${action.transition ? JSON.stringify(action.transition) : 'none'}`);
  }
});
