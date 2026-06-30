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
  'semantic-11.js', 'semantic-12.js', 'semantic-15.js'
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

const doc = new window.DOMParser().parseFromString(outputs.svg, 'image/svg+xml');
const script = doc.querySelector('script');
if (script) {
  const startIdx = script.textContent.indexOf('const D=');
  if (startIdx >= 0) {
    let braceCount = 0;
    let jsonStart = startIdx + 8;
    let jsonEnd = -1;
    for (let i = jsonStart; i < script.textContent.length; i++) {
      if (script.textContent[i] === '{') {
        braceCount++;
      } else if (script.textContent[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          jsonEnd = i + 1;
          break;
        }
      }
    }
    const json = script.textContent.slice(jsonStart, jsonEnd);
    const D = JSON.parse(json);
    const track = D.tracks.find(t => t.id && t.id.includes('bar-chart[0]'));
    console.log('Dist bar-chart[0] track:', track);
  }
}
