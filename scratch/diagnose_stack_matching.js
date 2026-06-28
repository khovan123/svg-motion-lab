const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state0 = manifest.states[0];

const dom = new JSDOM(state0.svg, {
  contentType: 'image/svg+xml',
  runScripts: "dangerously"
});
const { window } = dom;
if (!window.CSS) window.CSS = {};
if (!window.CSS.escape) {
  window.CSS.escape = function (value) {
    return String(value).replace(/([^\w-])/g, "\\$1");
  };
}

// Define the mocks so semantic-15.js runs
window.__SMC = {
  buildBaseSchedule: () => ({}),
  customSchedule: () => ({ stateIds: [] }),
  buildHtml: () => "",
  round: (v) => v
};
window.SvgMotionCompiler = {};

// Read semantic-15.js
const webDir = path.join(__dirname, '../web');
let semantic15 = fs.readFileSync(path.join(webDir, 'semantic-15.js'), 'utf8');
window.eval(semantic15);

// Run matchGeometryGloballyV2
const resultSvg = window.SvgMotionCompiler.matchGeometryGloballyV2(state0);

// Parse the result
const resultDom = new JSDOM(resultSvg, { contentType: 'image/svg+xml' });
const matchedEls = resultDom.window.document.querySelectorAll('[data-motion-id]');

console.log('=== Matched elements in State 0 SVG: ===');
matchedEls.forEach(el => {
  const mid = el.getAttribute('data-motion-id');
  const b = window.SvgMotionCompiler.getAbsoluteBounds(el);
  console.log(`Tag: ${el.tagName.toLowerCase()}, ID: ${mid.replace('1:4565:@root/', '')}, Bounds: ${JSON.stringify(b)}`);
});
