const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

// Load compiler scripts
const webDir = path.join(__dirname, '../web');
const scripts = [
  "semantic-1.js", "semantic-2.js", "semantic-3.js", "semantic-4.js", "semantic-5.js",
  "semantic-6.js", "semantic-7.js", "semantic-8.js", "semantic-9.js", "semantic-10.js",
  "semantic-11.js", "semantic-12.js", "semantic-13.js", "semantic-15.js", "semantic-14.js",
  "semantic-16.js", "semantic-runtime-fix.js"
];

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", { runScripts: "dangerously" });
if (!dom.window.CSS) dom.window.CSS = {};
if (!dom.window.CSS.escape) {
  dom.window.CSS.escape = function (value) {
    return String(value).replace(/([^\w-])/g, "\\$1");
  };
}

for (const s of scripts) {
  let code = fs.readFileSync(path.join(webDir, s), "utf8");
  
  if (s === "semantic-14.js") {
    // We will inject our new checkIsPie, ringElements and removeCompiledRing
    const replacement = `
function checkIsPie(element) {
  const tag = String(element.tagName).toLowerCase();
  if (tag === 'mask' || tag === 'g' || tag === 'path') {
    const paths = tag === 'path' ? [element] : Array.from(element.querySelectorAll('path'));
    if (paths.length === 0) return false;
    for (const p of paths) {
      const d = p.getAttribute('d') || '';
      const match = d.match(/M\\s*(-?\\d*\\.?\\d+)\\s*(-?\\d*\\.?\\d+)/i);
      if (match) {
        const x = Number(match[1]);
        const y = Number(match[2]);
        if (x >= 210 && x <= 295 && y >= 45 && y <= 130) {
          return true;
        }
      }
    }
  }
  const motionId = element.getAttribute('data-motion-id') || '';
  return motionId.includes('piechart');
}

function ringElements(source) {
  const children = [...source.children];
  const connectorIndex = children.findIndex(isConnector);
  if (connectorIndex < 0) return [];
  return children.slice(0, connectorIndex).filter(element => {
    const tag = String(element.tagName).toLowerCase();
    if (tag === 'mask') return false; // Skip masks in scene!
    return checkIsPie(element);
  });
}

function removeCompiledRing(scene) {
  const children = [...scene.children];
  const connectorIndex = children.findIndex(isConnector);
  if (connectorIndex < 0) return null;
  children.forEach(element => {
    if (checkIsPie(element)) {
      element.remove();
    }
  });
  return [...scene.children].find(isConnector) || null;
}
`;
    // Replace the functions in the code
    code = code.replace(/function ringElements[\s\S]*?\}\s*function removeCompiledRing[\s\S]*?\}\n/, replacement);
  }
  
  dom.window.eval(code);
}

const compiler = dom.window.SvgMotionCompiler;
console.log("Compiling manifest with fix...");
const result = compiler.compile(manifest, { loop: true });

// Print generated exact-ring elements
const resultDoc = new dom.window.DOMParser().parseFromString(result.svg, 'image/svg+xml');
const ring = resultDoc.querySelector('[data-exact-ring]');
if (ring) {
  console.log(`\nExact ring has ${ring.children.length} states:`);
  Array.from(ring.children).forEach((child, idx) => {
    console.log(`State ${idx}: tag = <${child.tagName}>, children count = ${child.children.length}`);
    Array.from(child.children).forEach((gc, gcIdx) => {
      const paths = gc.querySelectorAll('path');
      console.log(`  Sub-child ${gcIdx}: <${gc.tagName}>, mask="${gc.getAttribute('mask') || ''}", paths inside = ${paths.length}`);
      paths.forEach((p, pIdx) => {
        console.log(`    Path ${pIdx}: d = "${p.getAttribute('d').slice(0, 50)}...", fill = "${p.getAttribute('fill') || ''}"`);
      });
    });
  });
} else {
  console.log("data-exact-ring NOT found in compiled SVG!");
}
