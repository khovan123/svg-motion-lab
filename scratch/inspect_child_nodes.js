const fs = require('fs');
const { JSDOM } = require('jsdom');

const htmlContent = fs.readFileSync('dist/animation.html', 'utf8');

const dom = new JSDOM(htmlContent, {
  resources: 'usable',
  runScripts: 'dangerously',
  beforeParse(window) {
    window.requestAnimationFrame = (cb) => {
      setTimeout(() => cb(Date.now()), 16);
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

// Manually execute scripts inside <svg>
const svgScripts = window.document.querySelectorAll('#motion-svg script');
svgScripts.forEach((script) => {
  try {
    window.eval(script.textContent);
  } catch (err) {
    console.error("Eval error:", err);
  }
});

setTimeout(() => {
  const svg = window.document.querySelector('#motion-svg');
  const rotor = window.document.querySelector('[data-refresh-rotor]');
  console.log("Rotor found:", !!rotor);
  if (rotor) {
    console.log("Rotor innerHTML length:", rotor.innerHTML.length);
    svg.__motionController.seek(0);
    console.log("Rotor children count:", rotor.children.length);
    Array.from(rotor.children).forEach((child, idx) => {
      console.log(`Child ${idx}: tag=${child.tagName}, html=${child.innerHTML.slice(0, 100)}`);
    });
  }
  process.exit(0);
}, 100);
