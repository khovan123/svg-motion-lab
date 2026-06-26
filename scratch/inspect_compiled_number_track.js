const fs = require('fs');
const { JSDOM } = require('jsdom');
const vm = require('vm');

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const doc = new JSDOM(svg, { contentType: 'image/svg+xml' }).window.document;
const scriptEl = doc.querySelector('script');
const scriptText = scriptEl ? scriptEl.textContent : '';

const modifiedScript = scriptText.replace('const D=', 'window.D=');

const sandbox = { 
  window: {}, 
  document: { 
    currentScript: { 
      closest: () => null 
    },
    querySelector: () => null
  },
  requestAnimationFrame: () => {},
  performance: { now: () => 0 }
};
sandbox.document.ownerDocument = sandbox.document;

vm.createContext(sandbox);
try {
  vm.runInContext(modifiedScript, sandbox);
} catch (e) {
  // Ignore
}

const D = sandbox.window.D;
if (D) {
  const t = D.tracks.find(tr => tr.id.includes('number'));
  if (t) {
    console.log(`Track: "${t.id}"`);
    console.log(`  pathMode: ${t.pathMode}`);
    console.log(`  paths count:`, t.paths ? t.paths.length : 0);
    if (t.paths) {
      t.paths.forEach((p, idx) => {
        console.log(`    State ${idx}: ${p ? p.substring(0, 80) + '...' : 'null'}`);
      });
    }
  } else {
    console.log("No number track found!");
  }
} else {
  console.log("Failed to intercept D!");
}
