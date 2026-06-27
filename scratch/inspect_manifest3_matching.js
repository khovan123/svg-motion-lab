const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Set window objects since compiler scripts expect window
const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;
global.window = window;
global.document = window.document;
global.DOMParser = window.DOMParser;
global.XMLSerializer = window.XMLSerializer;

if (!window.CSS) {
  window.CSS = {};
}
if (!window.CSS.escape) {
  window.CSS.escape = function (value) {
    return String(value).replace(/([^\w-])/g, "\\$1");
  };
}
global.CSS = window.CSS;

window.SvgMotionCompiler = {};

// Load all scripts in order
const scripts = [
  "semantic-1.js", "semantic-2.js", "semantic-3.js", "semantic-4.js", "semantic-5.js",
  "semantic-6.js", "semantic-7.js", "semantic-8.js", "semantic-9.js", "semantic-10.js",
  "semantic-11.js", "semantic-12.js", "semantic-15.js", "semantic-13.js", "semantic-14.js",
  "semantic-16.js", "semantic-runtime-fix.js"
];

scripts.forEach(sName => {
  const p = path.join('web', sName);
  const code = fs.readFileSync(p, 'utf8');
  eval(code);
});

const compiler = window.SvgMotionCompiler;
const manifest = JSON.parse(fs.readFileSync('motion-manifest3.json', 'utf8'));

// Run compile
const normalized = compiler.compile(manifest);

normalized.normalizedManifest.states.forEach((state, stateIdx) => {
  console.log(`\n================ Mappings for State ${stateIdx}: ${state.name} ================`);
  const doc = new DOMParser().parseFromString(state.svg, 'image/svg+xml');
  
  const searchNames = ['giao-bi', 'thc-hin', 'label', 'doc-icon', 'pen-icon', 'check-icon', 'active', 'bar', 'line', 'number'];
  
  searchNames.forEach(name => {
    const selector = `[data-motion-id*="${name}"]`;
    const elements = doc.querySelectorAll(selector);
    console.log(`Searching for "${name}":`);
    if (elements.length === 0) {
      console.log(`  NOT MAPPED!`);
    } else {
      elements.forEach(el => {
        let parentInfo = '';
        if (el.parentNode && el.parentNode.tagName) {
          parentInfo = ` | parent: <${el.parentNode.tagName.toLowerCase()} data-motion-id="${el.parentNode.getAttribute('data-motion-id') || ''}">`;
        }
        
        let boundsInfo = '';
        // If path, print d first few chars
        if (el.tagName.toLowerCase() === 'path') {
          boundsInfo = ` | d="${el.getAttribute('d').substring(0, 30)}..."`;
        } else if (el.tagName.toLowerCase() === 'rect') {
          boundsInfo = ` | rect x="${el.getAttribute('x')}" y="${el.getAttribute('y')}" w="${el.getAttribute('width')}" h="${el.getAttribute('height')}"`;
        }
        
        console.log(`  - <${el.tagName.toLowerCase()} data-motion-id="${el.getAttribute('data-motion-id')}">${boundsInfo}${parentInfo}`);
      });
    }
  });
});
