const fs = require('fs');
const { JSDOM } = require('jsdom');

// Let's load the JSDOM environment and the compiler script
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: "dangerously" });
const { window } = dom;

// Read figma-motion-compiler web scripts to define SvgMotionCompiler
const webDir = 'web';
const scripts = [];
for (let i = 1; i <= 16; i++) {
  scripts.push(`semantic-${i}.js`);
}
scripts.push("semantic-runtime-fix.js");

// Set up S SMC mockup
window.__SMC = {
  buildBaseSchedule: () => ({}),
  buildHtml: () => "",
  round: x => x
};

for (const scriptName of scripts) {
  const code = fs.readFileSync(`${webDir}/${scriptName}`, 'utf8');
  window.eval(code);
}

const compiler = window.SvgMotionCompiler;
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

// Let's run matchGeometryGloballyV2 on State 0
const state0 = manifest.states[0];
// We need to simulate the environment in which matchGeometryGloballyV2 runs (which is inside window context)
// Let's run it by calling canonicalizeManifest or by evaluating in JSDOM
window.manifest = manifest;
window.state0 = state0;
const resultSvg = window.eval(`
  const normalized = SvgMotionCompiler.compile(window.manifest);
  normalized.svg; // wait, compiled svg
`);

// Or we can call matchGeometryGloballyV2 directly
const correctedSvg = window.eval(`
  // Let's expose matchGeometryGloballyV2 or just call compile
  // SvgMotionCompiler compile will run canonicalizeManifest
  const normalized = SvgMotionCompiler.compile(window.manifest);
  normalized;
`);

// Let's inspect the DOM of the compiled SVG (re-matched)
const resultDoc = new dom.window.DOMParser().parseFromString(correctedSvg.svg, 'image/svg+xml');
console.log("Elements with data-motion-id in compiled SVG:");
resultDoc.querySelectorAll('*').forEach(el => {
  const id = el.getAttribute('data-motion-id');
  if (id) {
    console.log(`- Tag=${el.tagName}, ID=${id}`);
    if (id.includes('container') || id.includes('refresh') || id.includes('vector-stroke')) {
      console.log(`  HTML: ${el.outerHTML.slice(0, 160)}`);
    }
  }
});
