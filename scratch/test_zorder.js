const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

// Emulate how getLayerParent works in semantic-15.js
function getLayerParent(layer, state) {
  if (!layer || !layer.parentStableNodeId) return null;
  return (state.layers || []).find(l => l.stableNodeId === layer.parentStableNodeId) || null;
}

// Let's test the z-order extraction for a few layers across all 10 states
const targetLayerIds = [
  '1:4565:@root/card-1[0]',
  '1:4565:@root/card-2[0]',
  '1:4565:@root/card-3[0]',
  '1:4565:@root/card-1[0]/avatar[0]',
  '1:4565:@root/card-2[0]/avatar[0]',
  '1:4565:@root/card-3[0]/avatar[0]'
];

console.log('--- Z-ORDER EXTRACT TEST ---');
targetLayerIds.forEach(id => {
  console.log(`\nLayer: ${id}`);
  
  const zOrders = manifest.states.map((state, idx) => {
    // Find layer in this state
    const layer = (state.layers || []).find(l => l.stableNodeId === id);
    if (layer) {
      return state.layers.indexOf(layer);
    }
    
    // Fallback: find parent
    // First find in state 0 or any state where it exists
    let baseLayer = null;
    let baseState = null;
    for (const s of manifest.states) {
      const l = (s.layers || []).find(x => x.stableNodeId === id);
      if (l) {
        baseLayer = l;
        baseState = s;
        break;
      }
    }
    
    if (baseLayer) {
      const baseParent = getLayerParent(baseLayer, baseState);
      if (baseParent) {
        const parentId = baseParent.stableNodeId;
        const targetParent = (state.layers || []).find(l => l.stableNodeId === parentId);
        if (targetParent) {
          return state.layers.indexOf(targetParent);
        }
      }
    }
    return 0;
  });
  
  console.log('  z-orders across states:', zOrders);
});
