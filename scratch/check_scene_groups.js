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
  window.CSS.escape = v => String(v).replace(/([^\w-])/g, '\\$1');
}

const webDir = path.join(__dirname, '../web');
// Load up to semantic-14 to inspect checkIsPie
const scripts = [
  'semantic-1.js', 'semantic-2.js', 'semantic-3.js', 'semantic-4.js', 'semantic-5.js',
  'semantic-6.js', 'semantic-7.js', 'semantic-8.js', 'semantic-9.js', 'semantic-10.js',
  'semantic-11.js', 'semantic-12.js', 'semantic-15.js', 'semantic-13.js'
];
for (const s of scripts) window.eval(fs.readFileSync(path.join(webDir, s), 'utf8'));

// Patch semantic-14 to expose checkIsPie
let sem14 = fs.readFileSync(path.join(webDir, 'semantic-14.js'), 'utf8');
// Expose checkIsPie before the closing bracket
sem14 = sem14.replace(
  `root.SvgMotionCompiler.compile=function`,
  `root.__checkIsPie = checkIsPie;\nroot.SvgMotionCompiler.compile=function`
);
window.eval(sem14);

const compiler = window.SvgMotionCompiler;
const baseSchedule = compiler.buildBaseSchedule(manifest);
const outputs = compiler.compile(manifest, { baseSchedule, customSegments: [], infinite: true });

// Check mask-group[0] in scene of INTERMEDIATE compiled SVG (before ring repair)
// We need to intercept before semantic-14 ring repair runs
// Instead let's check the final SVG and trace which mask-group elements are in scene
const doc = new window.DOMParser().parseFromString(outputs.svg, 'image/svg+xml');

const scene = doc.getElementById('motion-scene') || doc.documentElement;
const defs = doc.querySelector('defs');

// List all g elements in scene with data-motion-id containing mask-group
console.log('mask-group g elements in scene:');
scene.querySelectorAll('g[data-motion-id*="mask-group"]').forEach(el => {
  const isInDefs = defs && defs.contains(el);
  if (!isInDefs) {
    console.log('  ', el.getAttribute('data-motion-id'), 
      'parent:', el.parentNode ? (el.parentNode.getAttribute('data-motion-id') || el.parentNode.tagName) : 'null',
      'children:', el.children.length);
  }
});

console.log('\nbar-chart g elements in scene:');
scene.querySelectorAll('g[data-motion-id*="bar-chart"]').forEach(el => {
  const isInDefs = defs && defs.contains(el);
  if (!isInDefs) {
    console.log('  ', el.getAttribute('data-motion-id'),
      'parent:', el.parentNode ? (el.parentNode.getAttribute('data-motion-id') || el.parentNode.tagName) : 'null',
      'children:', el.children.length);
  }
});
