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

const scratchDir = __dirname;
const webDir = path.join(__dirname, '../web');
const scripts = [
  'semantic-1.js', 'semantic-2.js', 'semantic-3.js', 'semantic-4.js', 'semantic-5.js',
  'semantic-6.js', 'semantic-7.js', 'semantic-8.js', 'semantic-9.js', 'semantic-10.js',
  'semantic-11.js', 'semantic-12.js', 'semantic-15.js', 'semantic-13.js', 'semantic-14.js',
  'semantic-16.js', 'semantic-runtime-fix.js'
];

for (const scriptName of scripts) {
  let code;
  if (scriptName === 'semantic-15.js') {
    code = fs.readFileSync(path.join(scratchDir, 'semantic-15.js'), 'utf8');
  } else {
    code = fs.readFileSync(path.join(webDir, scriptName), 'utf8');
  }
  window.eval(code);
}

const compiler = window.SvgMotionCompiler;
const baseSchedule = compiler.buildBaseSchedule(manifest);
const outputs = compiler.compile(manifest, {
  baseSchedule,
  customSegments: [],
  infinite: true
});

const distDom = new JSDOM(outputs.svg);
const distScripts = distDom.window.document.querySelectorAll('script');
distScripts.forEach(script => {
  const text = script.textContent;
  const match = text.match(/const D=(\{.*\}),svg=/);
  if (match) {
    const data = JSON.parse(match[1]);
    if (data.tracks) {
      const containerTrack = data.tracks.find(t => t.id.includes('container[0]'));
      console.log('Container track tag:', containerTrack ? containerTrack.tag : 'NOT FOUND');
      console.log('Container track colors:', containerTrack ? containerTrack.colors : 'NOT FOUND');
      
      const rotorTrack = data.tracks.find(t => t.id.includes('hugeiconsrefresh-03-stroke-rounded-1[0]'));
      console.log('Rotor track tag:', rotorTrack ? rotorTrack.tag : 'NOT FOUND');
      console.log('Rotor track colors:', rotorTrack ? rotorTrack.colors : 'NOT FOUND');
    }
  }
});
