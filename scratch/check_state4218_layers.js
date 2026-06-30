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

// Check normalized state 1:4218 layers for old-style names
const state4218 = normalized.states.find(s => s.id === '1:4218');
if (state4218) {
  console.log('Normalized state 1:4218 mask-group layers:');
  state4218.layers.filter(l => l.stableNodeId.includes('mask-group')).forEach(l => {
    console.log('  ', l.stableNodeId);
  });
  
  // Also check what buildStateMapping gives for this state
  const mapping = compiler.buildStateMapping(state4218);
  console.log('\nbuildStateMapping for state 1:4218 (first 10):');
  let count = 0;
  mapping.forEach((v, k) => {
    if (count++ < 10 || k.includes('mask-group')) {
      console.log('  ', k, '->', v);
    }
  });
}
