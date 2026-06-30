const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  runScripts: 'dangerously'
});
const { window } = dom;
if (!window.CSS) window.CSS = {};
if (!window.CSS.escape) {
  window.CSS.escape = function (value) {
    return String(value).replace(/([^\w-])/g, '\\$1');
  };
}

const webDir = path.join(__dirname, '../web');
const scripts = [
  'semantic-1.js', 'semantic-2.js', 'semantic-3.js', 'semantic-4.js', 'semantic-5.js',
  'semantic-6.js', 'semantic-7.js', 'semantic-8.js', 'semantic-9.js', 'semantic-10.js',
  'semantic-11.js', 'semantic-12.js', 'semantic-15.js', 'semantic-13.js', 'semantic-14.js',
  'semantic-16.js', 'semantic-runtime-fix.js'
];

for (const scriptName of scripts) {
  const code = fs.readFileSync(path.join(webDir, scriptName), 'utf8');
  window.eval(code);
}

const compiler = window.SvgMotionCompiler;

// Let's hook buildTrack
const oldCompile = compiler.compile;
window.eval(`
  const oldCompile = window.SvgMotionCompiler.compile;
  window.SvgMotionCompiler.compile = function(manifest, options) {
    // We run the original compile but let's capture IDs and buildTrack returns inside IIFE by intercepting map
    return oldCompile(manifest, options);
  };
`);

// Wait, we can't easily intercept local variables inside IIFE, but we can do it by modifying scratch/semantic-15.js!
// Let's write a debug statement into scratch/semantic-15.js where tracks is filtered.
// But first, let's check if the ID exists in outputs.normalizedManifest!
const baseSchedule = compiler.buildBaseSchedule(manifest);
const outputs = compiler.compile(manifest, {
  baseSchedule,
  customSegments: [],
  infinite: true
});

const norm = outputs.normalizedManifest;
console.log('Is mask-group-yellow[0] in normalized manifest states?');
norm.states.forEach((s, idx) => {
  const hasLayer = s.layers.some(l => l.stableNodeId.includes('mask-group-yellow[0]'));
  console.log(`  State ${idx}: ${hasLayer}`);
});
