const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

// Load compiler scripts to run matching
const webDir = path.join(__dirname, '../web');
const scripts = [
  "semantic-1.js", "semantic-2.js", "semantic-3.js", "semantic-4.js", "semantic-5.js",
  "semantic-6.js", "semantic-7.js", "semantic-8.js", "semantic-9.js", "semantic-10.js",
  "semantic-11.js", "semantic-12.js", "semantic-13.js", "semantic-15.js", "semantic-14.js",
  "semantic-16.js", "semantic-runtime-fix.js"
];

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", { runScripts: "dangerously" });
if (!dom.window.CSS) dom.window.CSS = {};
if (!dom.window.CSS.escape) {
  dom.window.CSS.escape = function (value) {
    return String(value).replace(/([^\w-])/g, "\\$1");
  };
}

for (const s of scripts) {
  const code = fs.readFileSync(path.join(webDir, s), "utf8");
  dom.window.eval(code);
}

const compiler = dom.window.SvgMotionCompiler;
const result = compiler.compile(manifest, { loop: true });

console.log("State-by-state rotation and matching for hugeicons/refresh-03-stroke-rounded 1:");
const targetId = '1:4181:@root/container[0]/hugeiconsrefresh-03-stroke-rounded-1[0]';

manifest.states.forEach((state, sIdx) => {
  const layer = state.layers.find(l => l.stableNodeId === targetId);
  const normalizedState = result.normalizedManifest.states[sIdx];
  const matchedElId = normalizedState.layers.find(l => l.stableNodeId === targetId);
  
  // Find matched element in parsed State SVG
  const doc = new dom.window.DOMParser().parseFromString(normalizedState.svg, 'image/svg+xml');
  const matchedEl = doc.querySelector(`[data-motion-id="${targetId}"]`);
  
  console.log(`\nState ${sIdx} (${state.name}):`);
  if (layer) {
    console.log(`  Manifest Layer rotation: ${layer.rotation}`);
    console.log(`  Manifest Layer bounds: ${JSON.stringify(layer.bounds)}`);
  } else {
    console.log(`  Layer not found in manifest state!`);
  }
  
  if (matchedEl) {
    console.log(`  Matched SVG element tag: <${matchedEl.tagName}>`);
    console.log(`  Matched SVG transform: "${matchedEl.getAttribute('transform') || ''}"`);
    // Print child paths
    const paths = matchedEl.querySelectorAll('path');
    console.log(`  Number of paths under matched element: ${paths.length}`);
    paths.forEach((p, pIdx) => {
      console.log(`    Child path ${pIdx} d="${p.getAttribute('d') ? p.getAttribute('d').slice(0, 50) + '...' : ''}" fill="${p.getAttribute('fill') || ''}" transform="${p.getAttribute('transform') || ''}"`);
    });
  } else {
    console.log(`  No matched SVG element found for this layer!`);
  }
});
