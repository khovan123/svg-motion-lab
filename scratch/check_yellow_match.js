const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: 'dangerously' });
const { window } = dom;
if (!window.CSS) window.CSS = {};
if (!window.CSS.escape) window.CSS.escape = v => String(v).replace(/([^\w-])/g, '\\$1');

const webDir = path.join(__dirname, '../web');
const scripts = ['semantic-1.js','semantic-2.js','semantic-3.js','semantic-4.js','semantic-5.js',
  'semantic-6.js','semantic-7.js','semantic-8.js','semantic-9.js','semantic-10.js',
  'semantic-11.js','semantic-12.js','semantic-15.js'];
for (const s of scripts) window.eval(fs.readFileSync(path.join(webDir, s), 'utf8'));

const compiler = window.SvgMotionCompiler;
const state0 = manifest.states[0];
const correctedSvg = compiler.matchGeometryGloballyV2(state0);
const doc = new window.DOMParser().parseFromString(correctedSvg, 'image/svg+xml');

// Find yellow[0] matched element
const yellow0 = doc.querySelector('[data-motion-id*="yellow[0]"]');
if (yellow0) {
  console.log('yellow[0]:', yellow0.tagName, 'parent chain:');
  let el = yellow0;
  while (el && el.tagName) {
    const mid = el.getAttribute('data-motion-id') || '';
    console.log('  ', el.tagName, mid || '(no id)');
    el = el.parentNode;
  }
}

// Find yellow_2[0] matched element
const yellow2 = doc.querySelector('[data-motion-id*="yellow_2[0]"]');
if (yellow2) {
  console.log('\nyellow_2[0]:', yellow2.tagName, 'parent chain:');
  let el = yellow2;
  while (el && el.tagName) {
    const mid = el.getAttribute('data-motion-id') || '';
    console.log('  ', el.tagName, mid || '(no id)');
    el = el.parentNode;
  }
}

// Are piechart paths inside defs/masks? 
const pichart_paths = doc.querySelectorAll('mask path[data-motion-id*="yellow"]');
console.log('\nyellow paths inside masks:', pichart_paths.length);
pichart_paths.forEach(p => console.log('  ', p.getAttribute('data-motion-id')));
