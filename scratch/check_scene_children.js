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
  const scene = window.document.querySelector('#motion-scene');
  
  svg.__motionController.seek(0);
  
  console.log("Direct children of #motion-scene after seek(0):");
  Array.from(scene.children).forEach((child, idx) => {
    const motionId = child.getAttribute('data-motion-id');
    const exact = child.getAttribute('data-exact-ring');
    console.log(`- Child ${idx}: tag=${child.tagName}, id="${child.getAttribute('id') || ''}", data-motion-id="${motionId || ''}", exact="${exact || ''}"`);
  });
  
  process.exit(0);
}, 100);
