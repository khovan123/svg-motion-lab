const fs = require('fs');
const { JSDOM } = require('jsdom');

const htmlContent = fs.readFileSync('dist/animation.html', 'utf8');

const callbacks = [];

const dom = new JSDOM(htmlContent, {
  resources: 'usable',
  runScripts: 'dangerously',
  beforeParse(window) {
    window.requestAnimationFrame = (cb) => {
      callbacks.push(cb);
    };
  }
});

const { window } = dom;

// Wait for scripts to execute
setTimeout(() => {
  const rotor = window.document.querySelector('[data-refresh-rotor]');
  console.log("Rotor found in HTML DOM:", !!rotor);
  if (rotor) {
    console.log("Initial transform:", rotor.getAttribute('transform'));
  }
  
  console.log("Registered callbacks count:", callbacks.length);
  
  const times = [0, 0.4, 0.8, 1.2, 1.6];
  times.forEach(t => {
    const currentCallbacks = [...callbacks];
    callbacks.length = 0;
    
    const now = window.performance.now() + t * 1000;
    currentCallbacks.forEach(cb => {
      try {
        cb(now);
      } catch (err) {
        console.error("Error during callback:", err);
      }
    });
    console.log(`Time: ${t.toFixed(1)}s, Rotor transform:`, rotor ? rotor.getAttribute('transform') : 'N/A');
  });
  
  process.exit(0);
}, 100);
