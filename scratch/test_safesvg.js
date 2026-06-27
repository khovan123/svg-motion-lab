const fs = require('fs');
const { JSDOM } = require('jsdom');

let svgContent = fs.readFileSync('dist/animation.svg', 'utf8');

// Replace document.currentScript.ownerDocument.documentElement with the safe fallback
svgContent = svgContent.replace(/document\.currentScript\.ownerDocument\.documentElement/g, '(document.currentScript && document.currentScript.ownerDocument || document).documentElement');

const callbacks = [];

const htmlContent = `<!DOCTYPE html><html><body>${svgContent}</body></html>`;

const dom = new JSDOM(htmlContent, {
  resources: 'usable',
  runScripts: 'dangerously',
  beforeParse(window) {
    window.requestAnimationFrame = (cb) => {
      callbacks.push(cb);
    };
    window.addEventListener('error', (event) => {
      console.error("JS Error inside JSDOM:", event.error ? event.error.stack : event.message);
    });
  }
});

const { window } = dom;
const doc = window.document;

// Wait a bit for scripts to run (JSDOM scripts run asynchronously on parse)
setTimeout(() => {
  // Find the rotor element
  const rotor = doc.querySelector('[data-refresh-rotor]');
  console.log("Rotor found in DOM:", !!rotor);
  if (rotor) {
    console.log("Initial transform:", rotor.getAttribute('transform'));
  }

  console.log("Registered callbacks count:", callbacks.length);

  const times = [0, 0.4, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.2];

  times.forEach(t => {
    // Run all registered animation frames
    callbacks.forEach(cb => {
      try {
        cb(t * 1000);
      } catch (err) {
        console.error("Error during callback:", err);
      }
    });
    console.log(`Time: ${t.toFixed(1)}s, Rotor transform:`, rotor ? rotor.getAttribute('transform') : 'N/A');
  });
}, 500);
