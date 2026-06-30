const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: 'dangerously' });
const { window } = dom;
if (!window.CSS) window.CSS = {};
if (!window.CSS.escape) window.CSS.escape = v => String(v).replace(/([^\w-])/g, '\\$1');

const webDir = path.join(__dirname, '../web');
let code = fs.readFileSync(path.join(webDir, 'semantic-15.js'), 'utf8');
code = code.replace(
  `root.SvgMotionCompiler={validate,buildBaseSchedule:S.buildBaseSchedule,compile,matchGeometryGloballyV2,getAbsoluteBounds};`,
  `root.SvgMotionCompiler={validate,buildBaseSchedule:S.buildBaseSchedule,compile,matchGeometryGloballyV2,getAbsoluteBounds,canonicalizeManifest,parseState,buildStateMapping,mapId};`
);
const scripts = [
  'semantic-1.js','semantic-2.js','semantic-3.js','semantic-4.js','semantic-5.js',
  'semantic-6.js','semantic-7.js','semantic-8.js','semantic-9.js','semantic-10.js',
  'semantic-11.js','semantic-12.js'
];
for (const s of scripts) window.eval(fs.readFileSync(path.join(webDir, s), 'utf8'));
window.eval(code);

const compiler = window.SvgMotionCompiler;
const normalized = compiler.canonicalizeManifest(manifest);
const baseSchedule = compiler.buildBaseSchedule(normalized);

// Build states map, including masks, and then canonicalize
const ordered = baseSchedule.stateIds.map(id => normalized.states.find(s => s.id === id)).filter(Boolean);
const allIds = new Set();

ordered.forEach((state, sIdx) => {
  const parsed = compiler.parseState(state);
  const mapping = compiler.buildStateMapping(state);
  const doc = parsed.doc;
  
  // Collect from scene AND masks
  doc.querySelectorAll('[data-motion-id]').forEach(el => {
    if (el.closest('defs')) return; // skip defs only
    const id = el.getAttribute('data-motion-id');
    const canonicalId = compiler.mapId(id, mapping);
    allIds.add(canonicalId);
  });
});

console.log('Total unique IDs:', allIds.size);
const pieIds = [...allIds].filter(id => id.includes('piechart') || id.includes('mask-group') || id.includes('cyan') || id.includes('yellow') || id.includes('orange') || id.includes('blue'));
console.log('Piechart-related IDs:');
pieIds.sort().forEach(id => console.log('  ', id));
