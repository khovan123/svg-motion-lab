const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  runScripts: "dangerously"
});
const { window } = dom;

if (!window.CSS) window.CSS = {};
if (!window.CSS.escape) {
  window.CSS.escape = function (value) {
    return String(value).replace(/([^\w-])/g, "\\$1");
  };
}

const webDir = 'web';
const scripts = [
  "semantic-1.js", "semantic-2.js", "semantic-3.js", "semantic-4.js", "semantic-5.js",
  "semantic-6.js", "semantic-7.js", "semantic-8.js", "semantic-9.js", "semantic-10.js",
  "semantic-11.js", "semantic-12.js", "semantic-15.js", "semantic-13.js", "semantic-14.js",
  "semantic-16.js", "semantic-runtime-fix.js"
];

for (const scriptName of scripts) {
  const code = fs.readFileSync(path.join(webDir, scriptName), "utf8");
  window.eval(code);
}

const compiler = window.SvgMotionCompiler;
const normalized = compiler.compile(manifest, {
  baseSchedule: compiler.buildBaseSchedule(manifest),
  infinite: true
}).normalizedManifest;

const state = normalized.states[3]; // State 3
console.log(`State: ${state.name}`);

const doc = new dom.window.DOMParser().parseFromString(state.svg, 'image/svg+xml');
const allElements = doc.querySelectorAll('*');

allElements.forEach((el, idx) => {
  const mid = el.getAttribute('data-motion-id');
  if (mid || el.tagName.toLowerCase() === 'path') {
    let details = '';
    if (el.tagName.toLowerCase() === 'path') {
      details = `d=${el.getAttribute('d').slice(0, 60)}...`;
    }
    console.log(`[${idx}] <${el.tagName.toLowerCase()}> data-motion-id="${mid || ''}" ${details}`);
  }
});
