const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state7 = manifest.states.find(s => s.id === '1:4402');
if (!state7) {
  console.log("Could not find State 7!");
  process.exit(1);
}

console.log("State 7 layers inside Piechart:");
function dumpPiechartLayers(node, indent = "") {
  if (node.stableNodeId && node.stableNodeId.includes('piechart')) {
    console.log(`${indent}- id=${node.id}, name="${node.name}", type=${node.type}, stableNodeId="${node.stableNodeId}"`);
    if (node.fills) console.log(`${indent}  Fills:`, JSON.stringify(node.fills));
    if (node.strokes) console.log(`${indent}  Strokes:`, JSON.stringify(node.strokes));
  }
  if (node.layers) {
    node.layers.forEach(l => dumpPiechartLayers(l, indent + "  "));
  }
}

state7.layers.forEach(layer => dumpPiechartLayers(layer));
