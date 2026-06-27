const fs = require('fs');
const { JSDOM } = require('jsdom');

const htmlContent = fs.readFileSync('dist/animation.html', 'utf8');

const dom = new JSDOM(htmlContent, {
  resources: 'usable',
  runScripts: 'dangerously',
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

  const times = [0, 0.4, 0.8, 1.2, 1.6, 2.0, 2.4, 3.2, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0];
  times.forEach(t => {
    svg.__motionController.seek(t);
    console.log(`\nTime: ${t}s`);
    if (rotor) {
      console.log(`  Rotor: visibility="${rotor.getAttribute('visibility')}", opacity="${rotor.getAttribute('opacity')}", transform="${rotor.getAttribute('transform')}"`);
      const children = Array.from(rotor.children);
      children.forEach((child, idx) => {
        console.log(`    Child ${idx} (${child.tagName}): visibility="${child.getAttribute('visibility')}", opacity="${child.getAttribute('opacity')}", transform="${child.getAttribute('transform')}"`);
      });
    }
  });

  process.exit(0);
}, 100);
