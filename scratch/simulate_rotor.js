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

// Manually eval all scripts in the window context using Function
const scripts = window.document.querySelectorAll('script');
console.log("Found scripts in SVG:", scripts.length);
scripts.forEach((s, i) => {
  try {
    const code = s.textContent;
    const fn = new Function('window', 'document', 'performance', 'requestAnimationFrame', 'CSS', `
      with(window) {
        ${code}
      }
    `);
    fn(window, window.document, window.performance, window.requestAnimationFrame, window.CSS);
  } catch (err) {
    console.error(`Error executing Script ${i}:`, err.stack);
  }
});

// Find the rotor element
const rotor = window.document.querySelector('[data-refresh-rotor]');
console.log("Rotor found in DOM:", !!rotor);
if (rotor) {
  console.log("Initial transform:", rotor.getAttribute('transform'));
}

console.log("Registered callbacks count:", callbacks.length);

const times = [0, 0.4, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.2];

times.forEach(t => {
  // Clear callbacks of previous frame to simulate requestAnimationFrame loop
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
