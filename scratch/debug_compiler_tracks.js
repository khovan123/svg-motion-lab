const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: "dangerously" });
if (!window.CSS) window.CSS = {};
if (!window.CSS.escape) {
  window.CSS.escape = function (value) {
    return String(value).replace(/([^\w-])/g, "\\$1");
  };
}

const scripts = [
  'web/semantic-1.js',
  'web/semantic-2.js',
  'web/semantic-3.js',
  'web/semantic-4.js',
  'web/semantic-5.js',
  'web/semantic-6.js',
  'web/semantic-7.js',
  'web/semantic-8.js',
  'web/semantic-9.js',
  'web/semantic-10.js',
  'web/semantic-11.js',
  'web/semantic-12.js',
  'web/semantic-13.js',
  'web/semantic-14.js',
  'web/semantic-15.js',
  'web/semantic-16.js',
  'web/semantic-runtime-fix.js'
];

scripts.forEach(s => {
  const code = fs.readFileSync(s, 'utf8');
  window.eval(code);
});

const compiler = window.SvgMotionCompiler;
const baseSchedule = compiler.buildBaseSchedule(manifest);
const outputs = compiler.compile(manifest, { baseSchedule, infinite: true });

// Extract D from SVG
const doc = new window.DOMParser().parseFromString(outputs.svg, 'image/svg+xml');
const scriptEl = doc.querySelector('script');
const scriptText = scriptEl ? scriptEl.textContent : '';
const match = scriptText.match(/const D=(.*?),\s*svg=/);

if (match) {
  const data = JSON.parse(match[1]);
  console.log(`Successfully parsed D. Found ${data.tracks.length} tracks.`);
  console.log("=== Active Tracks ===");
  data.tracks.forEach(track => {
    if (track.id.includes('active')) {
      console.log(`ID: ${track.id}`);
      console.log(`  present: ${JSON.stringify(track.present)}`);
      console.log(`  tag: ${track.tag}`);
    }
  });
} else {
  console.log("Could not find D in script text:", scriptText.slice(0, 100));
}
