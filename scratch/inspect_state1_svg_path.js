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

const state1 = normalized.states[1];
const doc = new window.DOMParser().parseFromString(state1.svg, 'image/svg+xml');

console.log("=== State 1 SVG DOM Path ===");
const pathEl = doc.querySelector('[data-motion-id*="cyan[0]"]');
if (pathEl) {
  console.log(`Tag: <${pathEl.tagName}> id="${pathEl.getAttribute('data-motion-id')}" fill="${pathEl.getAttribute('fill')}"`);
} else {
  console.log("Not found in State 1 SVG");
}
