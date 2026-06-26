const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgContent = fs.readFileSync('dist/animation.svg', 'utf8');

// Load JSDOM with script execution enabled
const dom = new JSDOM(svgContent, {
  resources: 'usable',
  runScripts: 'dangerously'
});

const { window } = dom;

// Emulate requestAnimationFrame
let callbacks = [];
window.requestAnimationFrame = (cb) => {
  callbacks.push(cb);
};

// Catch unhandled errors
window.addEventListener('error', (event) => {
  console.error("JS Error in JSDOM:", event.error ? event.error.stack : event.message);
});

console.log("SVG loaded. Simulating ticks...");

// Trigger onload / script executions
try {
  // JSDOM runs inline scripts on load
  // Let's run a few animation ticks
  for (let i = 0; i < 5; i++) {
    const currentCallbacks = callbacks;
    callbacks = [];
    currentCallbacks.forEach(cb => {
      try {
        cb(i * 1000);
      } catch (err) {
        console.error(`Error during tick callback ${i}:`, err.stack);
      }
    });
  }
  console.log("Ticks simulated. No unhandled errors caught.");
} catch (err) {
  console.error("Error during execution:", err);
}
