const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  runScripts: 'dangerously'
});
const { window } = dom;
if (!window.CSS) window.CSS = {};
if (!window.CSS.escape) {
  window.CSS.escape = function (value) {
    return String(value).replace(/([^\w-])/g, '\\$1');
  };
}

const webDir = path.join(__dirname, '../web');
const scripts = [
  'semantic-1.js', 'semantic-2.js', 'semantic-3.js', 'semantic-4.js', 'semantic-5.js',
  'semantic-6.js', 'semantic-7.js', 'semantic-8.js', 'semantic-9.js', 'semantic-10.js',
  'semantic-11.js', 'semantic-12.js', 'semantic-15.js', 'semantic-13.js', 'semantic-14.js',
  'semantic-16.js', 'semantic-runtime-fix.js'
];

for (const scriptName of scripts) {
  const code = fs.readFileSync(path.join(webDir, scriptName), 'utf8');
  window.eval(code);
}

const compiler = window.SvgMotionCompiler;
const baseSchedule = compiler.buildBaseSchedule(manifest);
const outputs = compiler.compile(manifest, {
  baseSchedule,
  customSegments: [],
  infinite: true
});

const distSvg = outputs.svg;
const distDoc = new window.DOMParser().parseFromString(distSvg, 'image/svg+xml');
const distTracks = [];
const distElements = distDoc.querySelectorAll('*');
for (let i = 0; i < distElements.length; i++) {
  const mid = distElements[i].getAttribute('data-motion-id');
  if (mid && !distTracks.includes(mid)) {
    distTracks.push(mid);
  }
}
distTracks.sort();

const verifySvg = fs.readFileSync('verify-z-c1/animation.svg', 'utf8');
const verifyDoc = new window.DOMParser().parseFromString(verifySvg, 'image/svg+xml');
const verifyTracks = [];
const verifyElements = verifyDoc.querySelectorAll('*');
for (let i = 0; i < verifyElements.length; i++) {
  const mid = verifyElements[i].getAttribute('data-motion-id');
  if (mid && !verifyTracks.includes(mid)) {
    verifyTracks.push(mid);
  }
}
verifyTracks.sort();

console.log('Verify tracks count:', verifyTracks.length);
console.log('Dist tracks count:', distTracks.length);

console.log('\nTracks in Verify but not in Dist:');
verifyTracks.forEach(t => {
  if (!distTracks.includes(t)) console.log('  ', t);
});

console.log('\nTracks in Dist but not in Verify:');
distTracks.forEach(t => {
  if (!verifyTracks.includes(t)) console.log('  ', t);
});
