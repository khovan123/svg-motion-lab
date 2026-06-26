const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", { runScripts: "dangerously" });
const { window } = dom;
global.DOMParser = window.DOMParser;
global.XMLSerializer = window.XMLSerializer;

window.SvgMotionCompiler = { compile: () => {} };
window.__SMC = {
  buildBaseSchedule: () => ({}),
  customSchedule: () => ({}),
  buildHtml: () => "",
  round: (v) => v
};

let code = fs.readFileSync('web/semantic-15.js', 'utf8');
code = code.replace('root.SvgMotionCompiler={validate,buildBaseSchedule:S.buildBaseSchedule,compile};', 
                    'root.SvgMotionCompiler={validate,buildBaseSchedule:S.buildBaseSchedule,compile,canonicalizeManifest};');

window.eval(code);

const compiler = window.SvgMotionCompiler;
const normalized = compiler.canonicalizeManifest(manifest);

const state0 = normalized.states[0];
console.log("State 0 layers after canonicalization:");
state0.layers.forEach((l, idx) => {
  console.log(`  Name: ${l.name}, stableNodeId: ${l.stableNodeId}`);
});
