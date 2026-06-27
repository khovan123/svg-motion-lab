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

// We will load semantic-15.js but replace the tolerance with 3.5 in memory
let code = fs.readFileSync('web/semantic-15.js', 'utf8');

// Replace tolerance 0.5 with 3.5 in isInside
code = code.replace(/bLayer\.x\s*-\s*0\.5/g, "bLayer.x - 3.5");
code = code.replace(/bLayer\.y\s*-\s*0\.5/g, "bLayer.y - 3.5");
code = code.replace(/bLayer\.x\s*\+\s*bLayer\.width\s*\+\s*0\.5/g, "bLayer.x + bLayer.width + 3.5");
code = code.replace(/bLayer\.y\s*\+\s*bLayer\.height\s*\+\s*0\.5/g, "bLayer.y + bLayer.height + 3.5");

code = code.replace('root.SvgMotionCompiler={validate,buildBaseSchedule:S.buildBaseSchedule,compile};', 
                    'root.SvgMotionCompiler={validate,buildBaseSchedule:S.buildBaseSchedule,compile,canonicalizeManifest};');

window.eval(code);

const compiler = window.SvgMotionCompiler;
const normalized = compiler.canonicalizeManifest(manifest);

// Let's count how many tracks are presence tracks after compiling with the new manifest
const ordered = manifest.states;
const parseState = (state) => {
  const doc = new DOMParser().parseFromString(state.svg, 'image/svg+xml');
  const svg = doc.documentElement;
  const map = new Map();
  svg.querySelectorAll('[data-motion-id]').forEach(el => {
    const id = el.getAttribute('data-motion-id');
    if (!map.has(id)) map.set(id, el);
  });
  return { state, map };
};
const states = normalized.states.map(parseState);
const ids = new Set();
states.forEach(state => state.map.forEach((_, id) => ids.add(id)));

console.log(`Total unique IDs after geometry matching with 3.5 tolerance: ${ids.size}`);
let presenceCount = 0;
const presenceTracks = [];
ids.forEach(id => {
  const present = states.map(state => state.map.has(id));
  const isPresence = present.some(Boolean) && present.some(v => !v);
  if (isPresence) {
    presenceCount++;
    presenceTracks.push({ id, present });
  }
});

console.log(`Total presence tracks: ${presenceCount}`);
presenceTracks.forEach(t => {
  console.log(`  Track: ${t.id} - present: [${t.present.map(v => v ? 1 : 0).join(', ')}]`);
});
