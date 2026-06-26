const fs = require('fs');

const m3 = JSON.parse(fs.readFileSync('motion-manifest3.json', 'utf8'));
const hasPie3 = m3.states.some(s => s.layers.some(l => l.name.toLowerCase().includes('piechart') || l.id.toLowerCase().includes('piechart')));
console.log("motion-manifest3.json has piechart layers:", hasPie3);

const m1 = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const hasPie1 = m1.states.some(s => s.layers.some(l => l.name.toLowerCase().includes('piechart') || l.id.toLowerCase().includes('piechart')));
console.log("motion-manifest.json has piechart layers:", hasPie1);
