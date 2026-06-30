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

// We want to intercept matchedNodes inside matchGeometryGloballyV2
code = code.replace(
  `  return doc.documentElement.outerHTML;`,
  `  // Print matches for container[0]
  const containerId = '1:4181:@root/container[0]';
  const matched = matchedNodes.get(containerId);
  console.log('State:', state.name || state.id, 'container[0] matched to:', matched ? matched.tagName : 'null', 'id =', matched ? matched.getAttribute('data-motion-id') : 'none');
  return doc.documentElement.outerHTML;`
);

fs.writeFileSync(path.join(scratchDir, 'semantic-15-debug-matches.js'), code, 'utf8');

const scripts = [
  'semantic-1.js', 'semantic-2.js', 'semantic-3.js', 'semantic-4.js', 'semantic-5.js',
  'semantic-6.js', 'semantic-7.js', 'semantic-8.js', 'semantic-9.js', 'semantic-10.js',
  'semantic-11.js', 'semantic-12.js', 'semantic-15-debug-matches.js', 'semantic-13.js', 'semantic-14.js',
  'semantic-16.js', 'semantic-runtime-fix.js'
];

for (const scriptName of scripts) {
  let fileCode;
  if (scriptName === 'semantic-15-debug-matches.js') {
    fileCode = fs.readFileSync(path.join(scratchDir, 'semantic-15-debug-matches.js'), 'utf8');
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
