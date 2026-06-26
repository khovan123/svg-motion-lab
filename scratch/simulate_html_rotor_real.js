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

if (!window.CSS) window.CSS = {};
if (!window.CSS.escape) {
  window.CSS.escape = function (value) {
    return String(value).replace(/([^\w-])/g, "\\$1");
  };
}

// Manually execute scripts inside <svg> because JSDOM HTML parser ignores SVG inline scripts
const svgScripts = window.document.querySelectorAll('#motion-svg script');
console.log(`Found ${svgScripts.length} inline scripts inside SVG.`);
svgScripts.forEach((script, idx) => {
  try {
    window.eval(script.textContent);
    console.log(`Executed SVG script ${idx} successfully.`);
  } catch (err) {
    console.error(`Error executing SVG script ${idx}:`, err);
  }
});

// Wait for other scripts
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
        // console.error("Error during callback:", err);
      }
    });
    console.log(`Time: ${t.toFixed(1)}s, Rotor transform:`, rotor ? rotor.getAttribute('transform') : 'N/A');
  });
  
  process.exit(0);
}, 100);
