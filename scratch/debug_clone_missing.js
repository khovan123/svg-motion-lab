const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: "dangerously" });
if (!window.CSS) window.CSS = {};
if (!window.CSS.escape) {
  window.CSS.escape = function (value) {
    return String(value).replace(/([^\w-])/g, "\\$1");
  };
}

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
  'web/semantic-15.js',
  'web/semantic-16.js',
  'web/semantic-runtime-fix.js'
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

const baseSchedule = compiler.buildBaseSchedule(normalized);
const options = { baseSchedule, infinite: true };

const base = options.baseSchedule;
const schedule = window.__SMC.customSchedule(base, options.customSegments, options.infinite);
const ordered = schedule.stateIds.map(id => normalized.states.find(state => state.id === id)).filter(Boolean);

const { DOMParser, XMLSerializer } = window;
const SVG_NS = 'http://www.w3.org/2000/svg';

function parseState(state) {
  const doc = new DOMParser().parseFromString(state.svg, 'image/svg+xml');
  const svg = doc.documentElement;
  const map = new Map();
  svg.querySelectorAll('[data-motion-id]').forEach(el => {
    const id = el.getAttribute('data-motion-id');
    if (!map.has(id)) map.set(id, el);
  });
  return { state, doc, svg, map };
}

function layerMap(state) {
  const out = new Map();
  (state.layers || []).forEach(layer => out.set(layer.stableNodeId, layer));
  return out;
}

const states = ordered.map(parseState);
const layerMaps = ordered.map(layerMap);
const ids = new Set();
states.forEach(state => state.map.forEach((_, id) => ids.add(id)));

const buildTrack = compiler.buildTrack;
const tracks = [...ids].map(id => buildTrack(id, states.map(state => state.map.get(id) || null), layerMaps.map(map => map.get(id) || null), states)).filter(Boolean);

console.log("=== Debugging cloneMissingTracks ===");
const baseSvg = states[0].svg.cloneNode(true);
let scene = baseSvg.querySelector('#motion-scene');
if (!scene) {
  scene = window.document.createElementNS(SVG_NS, 'g');
  scene.id = 'motion-scene';
  [...baseSvg.children].filter(child => String(child.tagName).toLowerCase() !== 'defs').forEach(child => scene.appendChild(child));
  baseSvg.appendChild(scene);
}

tracks.forEach(track => {
  if (track.id.includes('active')) {
    console.log(`Track: ${track.id}`);
    console.log(`  baseIndex: ${track.baseIndex}`);
    if (track.baseIndex === 0) {
      console.log("  Skipping clone because baseIndex is 0");
      return;
    }
    const source = states[track.baseIndex].map.get(track.id);
    console.log(`  source found: ${!!source}`);
    if (!source) return;
    
    const parentNode = source.parentNode;
    console.log(`  source parent tag: ${parentNode ? parentNode.tagName : 'none'}`);
    let parentId = null;
    if (parentNode && parentNode.getAttribute && parentNode.getAttribute('data-motion-id')) {
      parentId = parentNode.getAttribute('data-motion-id');
    }
    console.log(`  source parent data-motion-id: ${parentId}`);
    
    let targetParent = null;
    if (parentId) {
      targetParent = scene.querySelector('[data-motion-id="' + window.CSS.escape(parentId) + '"]');
    }
    console.log(`  targetParent found in scene: ${!!targetParent}`);
  }
});
