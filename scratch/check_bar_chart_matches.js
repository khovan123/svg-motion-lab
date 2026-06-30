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

manifest.states.forEach((state, stateIdx) => {
  const correctedSvg = compiler.matchGeometryGloballyV2(state);
  const doc = new window.DOMParser().parseFromString(correctedSvg, 'image/svg+xml');
  const matched = doc.querySelector('[data-motion-id*="bar-chart[0]"]');
  if (matched && matched.getAttribute('data-motion-id') === '1:4181:@root/bar-chart[0]') {
    console.log(`State ${stateIdx} (${state.name || state.id}) matched bar-chart[0] to:`, matched.tagName, 'parent:', matched.parentNode.tagName);
  }
});
