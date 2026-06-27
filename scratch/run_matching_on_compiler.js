const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');

// Set window objects since compiler scripts expect window
const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;
global.window = window;
global.document = window.document;
global.DOMParser = window.DOMParser;
global.XMLSerializer = window.XMLSerializer;

if (!window.CSS) {
  window.CSS = {};
}
if (!window.CSS.escape) {
  window.CSS.escape = function (value) {
    return String(value).replace(/([^\w-])/g, "\\$1");
  };
}
global.CSS = window.CSS;

window.SvgMotionCompiler = {};

// Load all scripts in order
const scripts = [
  "semantic-1.js", "semantic-2.js", "semantic-3.js", "semantic-4.js", "semantic-5.js",
  "semantic-6.js", "semantic-7.js", "semantic-8.js", "semantic-9.js", "semantic-10.js",
  "semantic-11.js", "semantic-12.js", "semantic-15.js", "semantic-13.js", "semantic-14.js",
  "semantic-16.js", "semantic-runtime-fix.js"
];

scripts.forEach(sName => {
  const p = path.join(__dirname, '../web', sName);
  const code = fs.readFileSync(p, 'utf8');
  eval(code);
});

const compiler = window.SvgMotionCompiler;
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

// Run compile
const normalized = compiler.compile(manifest);
const state0 = normalized.normalizedManifest.states[0];

console.log("\nMapping after matchGeometryGloballyV2 in compiler:");
const doc = new DOMParser().parseFromString(state0.svg, 'image/svg+xml');
const allMapped = doc.querySelectorAll('[data-motion-id]');

allMapped.forEach(el => {
  const motionId = el.getAttribute('data-motion-id');
  if (motionId.includes('hugeicons') || motionId.includes('piechart') || motionId.includes('container')) {
    console.log(`Node tag: <${el.tagName}> data-motion-id="${motionId}"`);
    if (el.tagName.toLowerCase() === 'path') {
      console.log(`  d: ${el.getAttribute('d').slice(0, 100)}...`);
    } else if (el.tagName.toLowerCase() === 'rect') {
      console.log(`  x=${el.getAttribute('x')} y=${el.getAttribute('y')} w=${el.getAttribute('width')} h=${el.getAttribute('height')}`);
    }
  }
});
