const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state = manifest.states[2];

const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: "dangerously" });
const parser = new window.DOMParser();
const doc = parser.parseFromString(state.svg, 'image/svg+xml');

// Let's run matchGeometryGloballyV2 logic on state SVG to set data-motion-ids first
const scripts = [
  'web/semantic-1.js',
  'web/semantic-2.js',
  'web/semantic-3.js',
  'web/semantic-4.js',
  'web/semantic-5.js',
  'web/semantic-6.js',
  'web/semantic-7.js',
  'web/semantic-8.js',
  'web/semantic-9.js',
  'web/semantic-10.js',
  'web/semantic-11.js',
  'web/semantic-12.js',
  'web/semantic-13.js',
  'web/semantic-14.js',
  'web/semantic-15.js'
];
scripts.forEach(s => {
  let code = fs.readFileSync(s, 'utf8');
  if (s === 'web/semantic-15.js') {
    code = code.replace(
      'root.SvgMotionCompiler={validate,buildBaseSchedule:S.buildBaseSchedule,compile};',
      'root.SvgMotionCompiler={validate,buildBaseSchedule:S.buildBaseSchedule,compile,canonicalizeManifest,buildTrack};'
    );
  }
  window.eval(code);
});

const compiler = window.SvgMotionCompiler;
const normalized = compiler.canonicalizeManifest(manifest);
const stateNorm = normalized.states[2];

const docNorm = parser.parseFromString(stateNorm.svg, 'image/svg+xml');
const rootSvg = docNorm.documentElement;

console.log("=== STATE 2 SVG DOM PATH/RECTS AROUND X=72 ===");
const els = rootSvg.querySelectorAll('path, rect');
els.forEach(el => {
  const fill = el.getAttribute('fill');
  const d = el.getAttribute('d');
  const x = el.getAttribute('x');
  if ((x && x === '72') || (d && (d.includes('M72') || d.includes(' 72')))) {
    console.log(`\nElement <${el.tagName}> data-motion-id="${el.getAttribute('data-motion-id')}" fill="${fill}"`);
    let parent = el.parentNode;
    let indent = "  ";
    while (parent && parent.tagName && parent.tagName.toLowerCase() !== 'svg') {
      console.log(`${indent}Parent <${parent.tagName}> data-motion-id="${parent.getAttribute('data-motion-id')}" clip-path="${parent.getAttribute('clip-path')}"`);
      parent = parent.parentNode;
      indent += "  ";
    }
  }
});
