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
  'web/semantic-15.js'
];
scripts.forEach(s => {
  let code = fs.readFileSync(s, 'utf8');
  if (s === 'web/semantic-15.js') {
    code = code.replace(
      'root.SvgMotionCompiler={validate,buildBaseSchedule:S.buildBaseSchedule,compile};',
      'root.SvgMotionCompiler={validate,buildBaseSchedule:S.buildBaseSchedule,compile,canonicalizeManifest,buildTrack};'
    );
  }
  window.eval(code);
});

const compiler = window.SvgMotionCompiler;
const normalized = compiler.canonicalizeManifest(manifest);

const state0 = normalized.states[0];
const doc = new window.DOMParser().parseFromString(state0.svg, 'image/svg+xml');

console.log("=== State 0 SVG DOM Paths ===");
doc.querySelectorAll('path').forEach(p => {
  console.log(`Tag: <${p.tagName}> id="${p.getAttribute('data-motion-id')}" fill="${p.getAttribute('fill')}"`);
});
