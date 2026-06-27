const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

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
  const p = path.join('web', sName);
  const code = fs.readFileSync(p, 'utf8');
  eval(code);
});

// Copy helper functions from semantic-15.js context by redefining them or using jsdom evaluation
const compiler = window.SvgMotionCompiler;
const manifest = JSON.parse(fs.readFileSync('motion-manifest3.json', 'utf8'));

// Run compile
const compiled = compiler.compile(manifest);

// Parse the compiled SVG
const doc = new DOMParser().parseFromString(compiled.svg, 'image/svg+xml');
const rootSvg = doc.documentElement;

console.log("=== Compiled SVG Path Mappings ===");
rootSvg.querySelectorAll('path').forEach((p, idx) => {
  const d = p.getAttribute('d') || '';
  const mId = p.getAttribute('data-motion-id') || '';
  console.log(`Path ${idx}: d="${d.substring(0, 45)}..." | mId="${mId}"`);
});
