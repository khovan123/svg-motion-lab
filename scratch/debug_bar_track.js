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

const distDom = new JSDOM(outputs.svg);
const distScripts = distDom.window.document.querySelectorAll('script');
let parsedDistTracks = [];
distScripts.forEach(script => {
  const text = script.textContent;
  const match = text.match(/const D=(\{.*\}),svg=/);
  if (match) {
    const data = JSON.parse(match[1]);
    if (data.tracks) parsedDistTracks = data.tracks;
  }
});

const trackId = '1:4181:@root/bar-chart[0]/1st-column[0]/active[0]';
const track = parsedDistTracks.find(t => t.id === trackId);
console.log('Track:', JSON.stringify(track, null, 2));
