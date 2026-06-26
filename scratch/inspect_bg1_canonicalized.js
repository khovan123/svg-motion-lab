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

const compiled = compiler.compile(manifest);
const doc = new dom.window.DOMParser().parseFromString(compiled.svg, 'image/svg+xml');

console.log("All elements with data-motion-id in compiled SVG:");
doc.querySelectorAll('[data-motion-id]').forEach(el => {
  const id = el.getAttribute('data-motion-id');
  console.log(`- ${el.tagName.toLowerCase()}: id=${id}`);
});
