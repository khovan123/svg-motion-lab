const fs = require('fs');

const svgText = fs.readFileSync('dist/animation.svg', 'utf8');
const dataStr = svgText.match(/const D=(\{[\s\S]*?\}),svg/)[1];
const data = JSON.parse(dataStr);

console.log("Checking if refresh paths have tracks in Script 0:");
data.tracks.forEach((t, idx) => {
  if (t.id.includes('hugeiconsrefresh') || t.id.includes('vector-stroke')) {
    console.log(`Track ${idx}: id = ${t.id}, present = ${JSON.stringify(t.present)}, numeric = ${JSON.stringify(t.numeric || null)}, pathMode = ${t.pathMode}, transforms = ${t.transforms ? 'yes' : 'no'}`);
  }
});
