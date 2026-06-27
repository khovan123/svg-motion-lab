const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgContent = fs.readFileSync('dist/animation.svg', 'utf8');

const callbacks = [];
const dom = new JSDOM(svgContent, {
  resources: 'usable',
  beforeParse(window) {
    window.requestAnimationFrame = (cb) => {
      callbacks.push(cb);
    };
  }
});

const { window } = dom;
if (!window.CSS) window.CSS = {};
if (!window.CSS.escape) {
  window.CSS.escape = function (value) {
    return String(value).replace(/([^\w-])/g, "\\$1");
  };
}

// Eval scripts
const scripts = window.document.querySelectorAll('script');
scripts.forEach(s => {
  try {
    const fn = new Function('window', 'document', 'performance', 'requestAnimationFrame', 'CSS', `
      with(window) {
        ${s.textContent}
      }
    `);
    fn(window, window.document, window.performance, window.requestAnimationFrame, window.CSS);
  } catch (err) {}
});

const ring = window.document.querySelector('[data-exact-ring]');
if (!ring) {
  console.log("No ring found!");
  process.exit(1);
}

const steps = [
  { t: 0.0, desc: "State 0 (0s)" },
  { t: 1.2, desc: "Transition State 0 -> State 1 (1.2s)" },
  { t: 2.0, desc: "State 1 (2s)" },
  { t: 4.4, desc: "Transition State 2 -> State 3 (4.4s)" },
  { t: 5.2, desc: "State 3 (5.2s)" }
];

steps.forEach(step => {
  console.log(`\n=== ${step.desc} ===`);
  
  // Clear and run callbacks
  const currentCallbacks = [...callbacks];
  callbacks.length = 0;
  currentCallbacks.forEach(cb => {
    cb(step.t * 1000);
  });

  Array.from(ring.children).forEach((child, idx) => {
    const stateIndex = child.getAttribute('data-ring-state');
    const visibility = child.getAttribute('visibility');
    const opacity = child.getAttribute('opacity');
    console.log(`  Wrapper [State ${stateIndex}]: visibility = ${visibility}, opacity = ${opacity}`);
  });
});
