const fs = require('fs');
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: "dangerously" });
const { window } = dom;

const webDir = 'web';
const scripts = [];
for (let i = 1; i <= 16; i++) {
  scripts.push(`semantic-${i}.js`);
}
scripts.push("semantic-runtime-fix.js");

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

// Run compile
const compiled = compiler.compile(manifest);

console.log("All data-motion-ids in State 0 SVG after canonicalization:");
const doc0 = new dom.window.DOMParser().parseFromString(manifest.states[0].svg, 'image/svg+xml');
doc0.querySelectorAll('[data-motion-id]').forEach(el => {
  console.log(`- ${el.tagName.toLowerCase()}: id=${el.getAttribute('data-motion-id')}`);
});
