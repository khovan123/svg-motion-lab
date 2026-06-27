const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

// Load compiler scripts
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

// Check State 2 SVG from normalizedManifest
const state2 = result.normalizedManifest.states[2];
const doc = new dom.window.DOMParser().parseFromString(state2.svg, 'image/svg+xml');
console.log("Checking State 2 SVG `<g>` elements and their data-motion-id:");
doc.querySelectorAll('g').forEach((g, idx) => {
  const motionId = g.getAttribute('data-motion-id');
  console.log(`Index ${idx}: <g> data-motion-id="${motionId || 'NONE'}"`);
});
