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
  'semantic-11.js', 'semantic-12.js', 'semantic-15.js'
];

for (const scriptName of scripts) {
  const code = fs.readFileSync(path.join(webDir, scriptName), 'utf8');
  window.eval(code);
}

const compiler = window.SvgMotionCompiler;
const state = manifest.states[0];

const correctedSvg = compiler.matchGeometryGloballyV2(state);
const doc = new window.DOMParser().parseFromString(correctedSvg, 'image/svg+xml');

console.log('All elements with data-motion-id that have parent mask:');
doc.querySelectorAll('mask [data-motion-id]').forEach(el => {
  console.log('  ', el.tagName, el.getAttribute('data-motion-id'), 'parent:', el.parentNode.tagName, 'parentId:', el.parentNode.getAttribute('id'));
});
