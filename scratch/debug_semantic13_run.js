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

const scratchDir = __dirname;
const webDir = path.join(__dirname, '../web');

const scripts = [
  'semantic-1.js', 'semantic-2.js', 'semantic-3.js', 'semantic-4.js', 'semantic-5.js',
  'semantic-6.js', 'semantic-7.js', 'semantic-8.js', 'semantic-9.js', 'semantic-10.js',
  'semantic-11.js', 'semantic-12.js', 'semantic-15.js', 'semantic-13.js'
];

for (const scriptName of scripts) {
  const code = fs.readFileSync(path.join(webDir, scriptName), 'utf8');
  window.eval(code);
}

const compiler = window.SvgMotionCompiler;
const baseSchedule = compiler.buildBaseSchedule(manifest);

// We intercept repair in semantic-13.js by modifying window.eval
// Actually we can just run SvgMotionCompiler.compile(manifest) and let's log the states!
const outputs = compiler.compile(manifest, {
  baseSchedule,
  customSegments: [],
  infinite: true
});

const doc = new window.DOMParser().parseFromString(outputs.svg, 'image/svg+xml');
const els = doc.querySelectorAll('*');
console.log('Searching for container[0] in compiled SVG:');
els.forEach(el => {
  const mid = el.getAttribute('data-motion-id');
  if (mid && mid.includes('container[0]')) {
    console.log('  ', el.tagName, 'mid =', mid, 'parent =', el.parentNode ? el.parentNode.tagName : 'null');
  }
});
