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
const baseSchedule = compiler.buildBaseSchedule(manifest);
const outputs = compiler.compile(manifest, {
  baseSchedule,
  customSegments: [],
  infinite: true
});

const norm = outputs.normalizedManifest;
const state0 = norm.states.find(s => s.id === baseSchedule.stateIds[0]);

const doc = new window.DOMParser().parseFromString(state0.svg, 'image/svg+xml');
const els = doc.querySelectorAll('[data-motion-id]');
console.log('Motion IDs in parsed state 0 SVG containing mask-group:');
els.forEach(el => {
  const id = el.getAttribute('data-motion-id');
  if (id.includes('mask-group')) {
    console.log('  ', id);
  }
});
