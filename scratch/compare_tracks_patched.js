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
const scratchDir = __dirname;
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
let missingInDist = 0;
verifyTracks.forEach(t => {
  if (!distTracks.includes(t)) {
    console.log('  ', t);
    missingInDist++;
  }
});

console.log('\nTracks in Dist but not in Verify:');
let extraInDist = 0;
distTracks.forEach(t => {
  if (!verifyTracks.includes(t)) {
    console.log('  ', t);
    extraInDist++;
  }
});

console.log(`\nMissing in Dist: ${missingInDist}, Extra in Dist: ${extraInDist}`);

// Save temporary outputs to dist-patched/
fs.mkdirSync('scratch/dist-patched', { recursive: true });
fs.writeFileSync('scratch/dist-patched/animation.svg', outputs.svg);
fs.writeFileSync('scratch/dist-patched/animation.html', outputs.html);
fs.writeFileSync('scratch/dist-patched/prototype-ir.json', JSON.stringify(outputs.ir, null, 2));
fs.writeFileSync('scratch/dist-patched/calibration-report.json', JSON.stringify({ report: outputs.report.report, schedule: outputs.report.schedule }, null, 2));

const irReport = outputs.report.report;
console.log('\nReport matches Verify report exactly?');
const verifyReport = JSON.parse(fs.readFileSync('verify-z-c1/calibration-report.json', 'utf8')).report;
for (const k of Object.keys(verifyReport)) {
  if (JSON.stringify(verifyReport[k]) !== JSON.stringify(irReport[k])) {
    console.log(`  Difference at [${k}]: Verify = ${JSON.stringify(verifyReport[k])}, Patched = ${JSON.stringify(irReport[k])}`);
  }
}
