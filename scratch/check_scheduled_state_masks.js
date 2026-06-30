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
  `root.SvgMotionCompiler={validate,buildBaseSchedule:S.buildBaseSchedule,compile,matchGeometryGloballyV2,getAbsoluteBounds,canonicalizeManifest,parseState,buildStateMapping};`
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

// Find scheduled state IDs
const baseSchedule = compiler.buildBaseSchedule(normalized);
console.log('Scheduled state IDs:', baseSchedule.stateIds);

// For each scheduled state, check if it has mask elements and what IDs they have
baseSchedule.stateIds.forEach(sid => {
  const state = normalized.states.find(s => s.id === sid);
  if (!state) { console.log(`State ${sid}: NOT FOUND`); return; }
  
  const parsed = compiler.parseState(state);
  // Get ALL data-motion-ids including masks
  const doc = parsed.doc;
  const maskEls = doc.querySelectorAll('mask [data-motion-id]');
  const maskIds = [...maskEls].map(el => el.getAttribute('data-motion-id'));
  
  const cyanInMask = maskIds.filter(id => id.includes('cyan'));
  const oldStyleInMask = maskIds.filter(id => id.includes('mask-group_'));
  console.log(`State ${sid} (${state.name}): maskIds count=${maskIds.length}, old-style=${oldStyleInMask.length}, cyan=${JSON.stringify(cyanInMask)}`);
});
