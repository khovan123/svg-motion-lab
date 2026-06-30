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

// Check state 0 after matchGeometryGloballyV2
const state0 = manifest.states[0];
const correctedSvg = compiler.matchGeometryGloballyV2(state0);
const doc = new window.DOMParser().parseFromString(correctedSvg, 'image/svg+xml');

// Find mask-group[0] in the corrected SVG
const mg0 = doc.querySelector('[data-motion-id$="mask-group[0]"]');
if (mg0) {
  let el = mg0;
  while (el) {
    const mid = el.getAttribute ? el.getAttribute('data-motion-id') : null;
    console.log('  ', el.tagName || '[doc]', mid || '(no id)');
    el = el.parentNode;
  }
} else {
  console.log('mask-group[0] not found');
}

// Find bar-chart[0]/1st-column[0]
const col1 = doc.querySelector('[data-motion-id*="1st-column[0]"]');
if (col1) {
  console.log('\n1st-column[0]:');
  col1.querySelectorAll('[data-motion-id]').forEach(el => {
    console.log('  ', el.tagName, el.getAttribute('data-motion-id'));
  });
}
