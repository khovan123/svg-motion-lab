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
  } catch (err) {}
});

setTimeout(() => {
  const svg = window.document.querySelector('#motion-svg');
  const rotor = window.document.querySelector('[data-refresh-rotor]');
  console.log("Rotor found:", !!rotor);
  
  if (!svg || !svg.__motionController) {
    console.log("Error: __motionController not found on SVG element!");
    process.exit(1);
  }

  const times = [0, 2.0, 4.0, 6.0, 8.0, 10.0, 12.0];
  times.forEach(t => {
    svg.__motionController.seek(t);
    console.log(`\nTime: ${t}s`);
    if (rotor) {
      const paths = Array.from(rotor.querySelectorAll('path'));
      paths.forEach((path, idx) => {
        console.log(`    Path ${idx} (${path.getAttribute('data-motion-id')}): visibility="${path.getAttribute('visibility')}", opacity="${path.getAttribute('opacity')}", d-length=${(path.getAttribute('d') || '').length}`);
      });
    }
  });

  process.exit(0);
}, 100);
