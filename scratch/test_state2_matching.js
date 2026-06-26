const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", { runScripts: "dangerously" });
const { window } = dom;
global.DOMParser = window.DOMParser;
global.XMLSerializer = window.XMLSerializer;

// Replicate functions (omitted detail for brevity, load semantic-15.js but replace IIFE)
let code = fs.readFileSync('web/semantic-15.js', 'utf8');
code = code.replace('root.SvgMotionCompiler={validate,buildBaseSchedule:S.buildBaseSchedule,compile};', 
                    'root.SvgMotionCompiler={validate,buildBaseSchedule:S.buildBaseSchedule,compile,canonicalizeManifest};');

window.SvgMotionCompiler = { compile: () => {} };
window.__SMC = {
  buildBaseSchedule: () => ({}),
  customSchedule: () => ({}),
  buildHtml: () => "",
  round: (v) => v
};
window.eval(code);

const compiler = window.SvgMotionCompiler;
const normalized = compiler.canonicalizeManifest(manifest);

const state2 = normalized.states[2];
console.log("State 2 layers after canonicalization:");
state2.layers.forEach((l, idx) => {
  if (l.stableNodeId.includes('bar-chart')) {
    console.log(`  Name: ${l.name}, stableNodeId: ${l.stableNodeId}, Bounds: ${JSON.stringify(l.bounds)}`);
  }
});

console.log("\nState 2 SVG elements containing data-motion-id after canonicalization:");
const doc = new DOMParser().parseFromString(state2.svg, 'image/svg+xml');
const collect = (node) => {
  const motionId = node.getAttribute('data-motion-id');
  if (motionId && motionId.includes('bar-chart')) {
    console.log(`  Tag: ${node.tagName.toLowerCase()}, ID: ${motionId}, bounds: x=${node.getAttribute('x')}, y=${node.getAttribute('y')}, w=${node.getAttribute('width')}, h=${node.getAttribute('height')}, transform=${node.getAttribute('transform')}`);
  }
  Array.from(node.children).forEach(collect);
};
collect(doc.documentElement);
