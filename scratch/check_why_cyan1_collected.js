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

let code = fs.readFileSync(path.join(webDir, 'semantic-15.js'), 'utf8');
code = code.replace(
  `root.SvgMotionCompiler={validate,buildBaseSchedule:S.buildBaseSchedule,compile,matchGeometryGloballyV2,getAbsoluteBounds};`,
  `root.SvgMotionCompiler={validate,buildBaseSchedule:S.buildBaseSchedule,compile,matchGeometryGloballyV2,getAbsoluteBounds,canonicalizeManifest,parseState};`
);

const scripts = [
  'semantic-1.js', 'semantic-2.js', 'semantic-3.js', 'semantic-4.js', 'semantic-5.js',
  'semantic-6.js', 'semantic-7.js', 'semantic-8.js', 'semantic-9.js', 'semantic-10.js',
  'semantic-11.js', 'semantic-12.js'
];

for (const scriptName of scripts) {
  const fileCode = fs.readFileSync(path.join(webDir, scriptName), 'utf8');
  window.eval(fileCode);
}
window.eval(code);

const compiler = window.SvgMotionCompiler;
const normalized = compiler.canonicalizeManifest(manifest);

normalized.states.forEach((state, sIdx) => {
  const p = compiler.parseState(state);
  p.map.forEach((el, id) => {
    if (id.includes('cyan')) {
      console.log(`State ${sIdx} (${state.name}) collected:`, id, 'parent:', el.parentNode.tagName, 'parentId:', el.parentNode.getAttribute('id'));
    }
  });
});
