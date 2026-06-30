const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: 'dangerously' });
const { window } = dom;
if (!window.CSS) window.CSS = {};
if (!window.CSS.escape) window.CSS.escape = v => String(v).replace(/([^\w-])/g, '\\$1');

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
const allMaskGroups = distDoc.querySelectorAll('[data-motion-id*="mask-group"]');
console.log('mask-group elements in compiled SVG:');
allMaskGroups.forEach(el => console.log(' ', el.tagName, el.getAttribute('data-motion-id')));
