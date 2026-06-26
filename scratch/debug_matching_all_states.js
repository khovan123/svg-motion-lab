const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  runScripts: "dangerously"
});
const { window } = dom;

if (!window.CSS) window.CSS = {};
if (!window.CSS.escape) {
  window.CSS.escape = function (value) {
    return String(value).replace(/([^\w-])/g, "\\$1");
  };
}

const webDir = 'web';
const scripts = [
  "semantic-1.js", "semantic-2.js", "semantic-3.js", "semantic-4.js", "semantic-5.js",
  "semantic-6.js", "semantic-7.js", "semantic-8.js", "semantic-9.js", "semantic-10.js",
  "semantic-11.js", "semantic-12.js", "semantic-15.js", "semantic-13.js", "semantic-14.js",
  "semantic-16.js", "semantic-runtime-fix.js"
];

for (const scriptName of scripts) {
  const code = fs.readFileSync(path.join(webDir, scriptName), "utf8");
  window.eval(code);
}

const compiler = window.SvgMotionCompiler;
if (!compiler) {
  console.error("Failed to load compiler");
  process.exit(1);
}

// Let's run canonicalizeManifest manually and inspect the matched nodes per state
const normalized = compiler.compile(manifest, {
  baseSchedule: compiler.buildBaseSchedule(manifest),
  infinite: true
}).normalizedManifest;

console.log('--- TRACK MATCHING STATS PER STATE ---');
normalized.states.forEach((state, sIdx) => {
  console.log(`\nState ${sIdx} (${state.name}):`);
  
  // Let's count how many layers of each type got matched
  const totalLayers = state.layers.length;
  let matchedCount = 0;
  
  const doc = new dom.window.DOMParser().parseFromString(state.svg, 'image/svg+xml');
  
  state.layers.forEach(layer => {
    const el = doc.querySelector(`[data-motion-id="${layer.stableNodeId}"]`);
    if (el) {
      matchedCount++;
    } else {
      console.log(`  MISSING MATCH: layer name="${layer.name}", type=${layer.type}, id=${layer.stableNodeId}`);
      console.log(`    bounds in manifest: ${JSON.stringify(layer.bounds)}`);
    }
  });
  console.log(`  Matched: ${matchedCount} / ${totalLayers} layers`);
});
