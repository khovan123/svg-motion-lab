const fs = require('fs');
const { JSDOM } = require('jsdom');

// Load files
const webDir = './web';
const scripts = [
  "semantic-1.js", "semantic-2.js", "semantic-3.js", "semantic-4.js", "semantic-5.js",
  "semantic-6.js", "semantic-7.js", "semantic-8.js", "semantic-9.js", "semantic-10.js",
  "semantic-11.js", "semantic-12.js", "semantic-13.js", "semantic-15.js"
];

const { window } = new JSDOM("<!DOCTYPE html><html><body></body></html>", { runScripts: "dangerously" });
if (!window.CSS) window.CSS = {};
if (!window.CSS.escape) {
  window.CSS.escape = val => String(val).replace(/([^\w-])/g, "\\$1");
}

scripts.forEach(scriptName => {
  const code = fs.readFileSync(`${webDir}/${scriptName}`, 'utf8');
  window.eval(code);
});

const compiler = window.SvgMotionCompiler;
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

// Test buildStateMapping for State 0
const state0 = manifest.states[0];
const corrected0 = window.matchGeometryGloballyV2(state0);
const stateWithGeom = Object.assign({}, state0, { svg: corrected0 });
const mapping = window.buildStateMapping(stateWithGeom);

console.log("=== State 0 Layer Mappings ===");
mapping.forEach((canonical, original) => {
  if (original.includes('column') || original.includes('active') || original.includes('background')) {
    console.log(`Original: "${original}" -> Canonical: "${canonical}"`);
  }
});
