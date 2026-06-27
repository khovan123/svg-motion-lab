const fs = require('fs');
const content = fs.readFileSync('motion-manifest.json', 'utf8');

const query1 = '15:924';
const query2 = '15-924';

console.log(`Contains "${query1}":`, content.includes(query1));
console.log(`Contains "${query2}":`, content.includes(query2));

const manifest = JSON.parse(content);
const matches = [];

manifest.states.forEach((state, sIdx) => {
  if (state.id.includes(query1) || state.name.includes(query1)) {
    matches.push({ type: 'state', idx: sIdx, id: state.id, name: state.name });
  }
  state.layers.forEach((layer, lIdx) => {
    if (layer.id.includes(query1) || layer.stableNodeId.includes(query1) || layer.name.includes(query1)) {
      matches.push({ type: 'layer', stateIdx: sIdx, layerIdx: lIdx, id: layer.id, stableNodeId: layer.stableNodeId, name: layer.name });
    }
  });
});

console.log("Matches found:", matches.length);
if (matches.length > 0) {
  console.log("Details:", JSON.stringify(matches, null, 2));
}
