const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('motion-manifest3.json', 'utf8'));

manifest.states.forEach((state, stateIdx) => {
  console.log(`\n================ State ${stateIdx}: ${state.name} ================`);
  state.layers.forEach(l => {
    const parentId = l.parentStableNodeId || '';
    if (parentId.includes('doc-icon') || parentId.includes('pen-icon') || parentId.includes('check-icon')) {
      console.log(`Layer Name: "${l.name}" | ID: ${l.id} | stableId: ${l.stableNodeId} | parent: ${l.parentStableNodeId}`);
      console.log(`  fills:`, JSON.stringify(l.fills));
      console.log(`  strokes:`, JSON.stringify(l.strokes));
      console.log(`  opacity:`, l.opacity);
      console.log(`  visible:`, l.visible);
      
      // Let's also check if this layer has children
      const children = state.layers.filter(c => c.parentStableNodeId === l.stableNodeId);
      children.forEach(c => {
        console.log(`    Child: "${c.name}" | ID: ${c.id} | stableId: ${c.stableNodeId}`);
        console.log(`      fills:`, JSON.stringify(c.fills));
        console.log(`      strokes:`, JSON.stringify(c.strokes));
      });
    }
  });
});
