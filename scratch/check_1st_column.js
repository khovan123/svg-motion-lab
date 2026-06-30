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
const state0 = manifest.states[0];
const correctedSvg = compiler.matchGeometryGloballyV2(state0);
const doc = new window.DOMParser().parseFromString(correctedSvg, 'image/svg+xml');

const col1 = doc.querySelector('[data-motion-id*="1st-column[0]"]');
if (col1) {
  console.log('1st-column[0] element:', col1.tagName, 'innerHTML length:', col1.innerHTML.length);
  // Print its direct children
  Array.from(col1.children).forEach(child => {
    const mid = child.getAttribute('data-motion-id') || '';
    console.log('  child:', child.tagName, 'mid:', mid, 'children:', child.children.length);
    // Print grandchildren
    Array.from(child.children).slice(0, 5).forEach(gc => {
      const gmid = gc.getAttribute('data-motion-id') || '';
      console.log('    grandchild:', gc.tagName, 'mid:', gmid, 'children:', gc.children.length);
    });
  });
}

// Print bar-chart[0] element
const bc = doc.querySelector('[data-motion-id*="bar-chart[0]"]');
if (bc) {
  console.log('\nbar-chart[0] element:', bc.tagName, 'children:', bc.children.length);
  const bounds = compiler.getAbsoluteBounds(bc);
  console.log('bounds:', bounds);
}
