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

const scratchDir = __dirname;
let code = fs.readFileSync(path.join(scratchDir, 'semantic-15.js'), 'utf8');

// We intercept matchedNodes and originalIds inside matchGeometryGloballyV2
code = code.replace(
  `  return new XMLSerializer().serializeToString(rootSvg);`,
  `  const cid = '1:4181:@root/container[0]/hugeiconsrefresh-03-stroke-rounded-1[0]';
  const orig = originalIds.get(cid);
  const matched = matchedNodes.get(cid);
  const children = state.layers.filter(l => l.parentStableNodeId === cid);
  const matchedChildren = children.map(c => ({ id: c.stableNodeId, matched: matchedNodes.get(c.stableNodeId) ? matchedNodes.get(c.stableNodeId).tagName : 'null' }));
  console.log('State:', state.name || state.id, 'origEl tag =', orig ? orig.tagName : 'null', 'matchedNode tag =', matched ? matched.tagName : 'null', 'childrenCount =', children.length, 'matchedChildren =', JSON.stringify(matchedChildren));
  return new XMLSerializer().serializeToString(rootSvg);`
);

fs.writeFileSync(path.join(scratchDir, 'semantic-15-debug-rotor.js'), code, 'utf8');

const scripts = [
  'semantic-1.js', 'semantic-2.js', 'semantic-3.js', 'semantic-4.js', 'semantic-5.js',
  'semantic-6.js', 'semantic-7.js', 'semantic-8.js', 'semantic-9.js', 'semantic-10.js',
  'semantic-11.js', 'semantic-12.js', 'semantic-15-debug-rotor.js', 'semantic-13.js', 'semantic-14.js',
  'semantic-16.js', 'semantic-runtime-fix.js'
];

for (const scriptName of scripts) {
  let fileCode;
  if (scriptName === 'semantic-15-debug-rotor.js') {
    fileCode = fs.readFileSync(path.join(scratchDir, 'semantic-15-debug-rotor.js'), 'utf8');
  } else {
    fileCode = fs.readFileSync(path.join(scratchDir, '../web', scriptName), 'utf8');
  }
  window.eval(fileCode);
}

const compiler = window.SvgMotionCompiler;
const baseSchedule = compiler.buildBaseSchedule(manifest);
const outputs = compiler.compile(manifest, {
  baseSchedule,
  customSegments: [],
  infinite: true
});
