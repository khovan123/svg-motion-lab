const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const state0 = manifest.states[0];
console.log("Checking svgNodeMap entries matching 'refresh' or 'hugeicons' or 'pie' or 'chart':");
state0.svgNodeMap.forEach((entry, idx) => {
  const s = entry.stableNodeId.toLowerCase();
  if (s.includes('refresh') || s.includes('hugeicons') || s.includes('pie') || s.includes('chart')) {
    console.log(`Entry ${idx}: stableNodeId = ${entry.stableNodeId}, tag = ${entry.tag}, layerId = ${entry.layerId}, properties: x=${entry.x}, y=${entry.y}, w=${entry.w}, h=${entry.h}`);
  }
});
