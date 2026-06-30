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
const scripts = [
  'semantic-1.js', 'semantic-2.js', 'semantic-3.js', 'semantic-4.js', 'semantic-5.js',
  'semantic-6.js', 'semantic-7.js', 'semantic-8.js', 'semantic-9.js', 'semantic-10.js',
  'semantic-11.js', 'semantic-12.js', 'semantic-15.js', 'semantic-13.js', 'semantic-14.js',
  'semantic-16.js', 'semantic-runtime-fix.js'
];
for (const s of scripts) window.eval(fs.readFileSync(path.join(webDir, s), 'utf8'));

const compiler = window.SvgMotionCompiler;
const baseSchedule = compiler.buildBaseSchedule(manifest);
const outputs = compiler.compile(manifest, { baseSchedule, customSegments: [], infinite: true });

const distDoc = new window.DOMParser().parseFromString(outputs.svg, 'image/svg+xml');
const verifyDoc = new window.DOMParser().parseFromString(
  fs.readFileSync('verify-z-c1/animation.svg', 'utf8'), 'image/svg+xml'
);

// Extract data-motion-ids from scene only (not defs)
function getSceneIds(doc) {
  const ids = new Set();
  const scene = doc.getElementById('motion-scene') || doc.documentElement;
  const defs = scene.querySelectorAll('defs');
  const inDefs = new Set();
  defs.forEach(d => d.querySelectorAll('[data-motion-id]').forEach(el => inDefs.add(el)));
  scene.querySelectorAll('[data-motion-id]').forEach(el => {
    if (!inDefs.has(el)) ids.add(el.getAttribute('data-motion-id'));
  });
  return ids;
}

function getDefsIds(doc) {
  const ids = new Set();
  doc.querySelectorAll('defs [data-motion-id]').forEach(el => ids.add(el.getAttribute('data-motion-id')));
  return ids;
}

const distSceneIds = getSceneIds(distDoc);
const verifySceneIds = getSceneIds(verifyDoc);
const distDefsIds = getDefsIds(distDoc);
const verifyDefsIds = getDefsIds(verifyDoc);

console.log('=== SCENE IDs ===');
console.log('Verify only:', [...verifySceneIds].filter(id => !distSceneIds.has(id)).sort().join('\n'));
console.log('\nDist only:', [...distSceneIds].filter(id => !verifySceneIds.has(id)).sort().join('\n'));

console.log('\n=== DEFS IDs ===');
console.log('Verify defs:', [...verifyDefsIds].sort().join('\n'));
console.log('\nDist defs:', [...distDefsIds].sort().join('\n'));
