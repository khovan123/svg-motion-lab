const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: 'dangerously' });
const { window } = dom;
if (!window.CSS) window.CSS = {};
if (!window.CSS.escape) window.CSS.escape = v => String(v).replace(/([^\w-])/g, '\\$1');

const webDir = path.join(__dirname, '../web');
const scripts = ['semantic-1.js','semantic-2.js','semantic-3.js','semantic-4.js','semantic-5.js',
  'semantic-6.js','semantic-7.js','semantic-8.js','semantic-9.js','semantic-10.js',
  'semantic-11.js','semantic-12.js','semantic-15.js'];
for (const s of scripts) window.eval(fs.readFileSync(path.join(webDir, s), 'utf8'));

const compiler = window.SvgMotionCompiler;
const state = manifest.states[0];

// Print bounds of mask-group and bar-chart layers
const interestingLayers = state.layers.filter(l => 
  l.stableNodeId.includes('mask-group') || l.stableNodeId.includes('bar-chart') || l.stableNodeId.includes('1st-column')
);
interestingLayers.forEach(l => console.log(l.stableNodeId, 'bounds:', JSON.stringify(l.bounds)));
