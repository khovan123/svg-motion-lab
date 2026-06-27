const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

// Dump all layers for state 0 and state 3 to see everything
[0, 3].forEach(stateIdx => {
  const state = manifest.states[stateIdx];
  console.log(`\n================ State ${stateIdx}: ${state.name} ================`);
  
  state.layers.forEach((layer, layerIdx) => {
    console.log(`\n  Layer ${layerIdx}: "${layer.name}"`);
    console.log(`    key: ${layer.key}`);
    console.log(`    type: ${layer.type}`);
    console.log(`    stableNodeId: ${layer.stableNodeId}`);
    console.log(`    parentKey: ${layer.parentKey}`);
    console.log(`    x: ${layer.x}, y: ${layer.y}`);
    console.log(`    width: ${layer.width}, height: ${layer.height}`);
    console.log(`    opacity: ${layer.opacity}`);
    if (layer.svg) console.log(`    svg: ${layer.svg.substring(0, 200)}...`);
    if (layer.fills) console.log(`    fills: ${JSON.stringify(layer.fills).substring(0, 200)}`);
    if (layer.strokes) console.log(`    strokes: ${JSON.stringify(layer.strokes).substring(0, 100)}`);
    if (layer.cornerRadius !== undefined) console.log(`    cornerRadius: ${layer.cornerRadius}`);
    if (layer.constraints) console.log(`    constraints: ${JSON.stringify(layer.constraints)}`);
    if (layer.clipsContent !== undefined) console.log(`    clipsContent: ${layer.clipsContent}`);
    if (layer.layoutMode) console.log(`    layoutMode: ${layer.layoutMode}`);
    if (layer.absoluteTransform) console.log(`    absoluteTransform: ${JSON.stringify(layer.absoluteTransform)}`);
    if (layer.relativeTransform) console.log(`    relativeTransform: ${JSON.stringify(layer.relativeTransform)}`);
    if (layer.visible !== undefined) console.log(`    visible: ${layer.visible}`);
    // Show all non-standard properties
    const standardKeys = new Set(['name','key','type','stableNodeId','parentKey','parentStableNodeId',
      'x','y','width','height','opacity','svg','fills','strokes','cornerRadius','constraints',
      'clipsContent','layoutMode','absoluteTransform','relativeTransform','visible','children','id']);
    const extraKeys = Object.keys(layer).filter(k => !standardKeys.has(k));
    if (extraKeys.length) {
      for (const k of extraKeys) {
        const val = JSON.stringify(layer[k]);
        console.log(`    ${k}: ${val ? val.substring(0, 200) : val}`);
      }
    }
  });
});
