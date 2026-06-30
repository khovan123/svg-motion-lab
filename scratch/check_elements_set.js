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

// We override matchedElementsSet.add to log when the rotor group element is added
code = code.replace(
  `  const matchedElementsSet = new Set();`,
  `  const matchedElementsSet = new Set();
  const oldAdd = matchedElementsSet.add;
  matchedElementsSet.add = function(el) {
    if (el && el.getAttribute && (el.getAttribute('data-motion-id') || '').includes('hugeiconsrefresh-03-stroke-rounded-1[0]')) {
      console.log('Rotor element added to matchedElementsSet! Stack trace:');
      console.log(new Error().stack);
    }
    return oldAdd.call(matchedElementsSet, el);
  };`
);

fs.writeFileSync(path.join(scratchDir, 'semantic-15-debug-set.js'), code, 'utf8');

const scripts = [
  'semantic-1.js', 'semantic-2.js', 'semantic-3.js', 'semantic-4.js', 'semantic-5.js',
  'semantic-6.js', 'semantic-7.js', 'semantic-8.js', 'semantic-9.js', 'semantic-10.js',
  'semantic-11.js', 'semantic-12.js', 'semantic-15-debug-set.js', 'semantic-13.js', 'semantic-14.js',
  'semantic-16.js', 'semantic-runtime-fix.js'
];

for (const scriptName of scripts) {
  let fileCode;
  if (scriptName === 'semantic-15-debug-set.js') {
    fileCode = fs.readFileSync(path.join(scratchDir, 'semantic-15-debug-set.js'), 'utf8');
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
