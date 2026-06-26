const fs = require('fs');
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: "dangerously" });
const { window } = dom;

const webDir = 'web';
const scripts = [];
for (let i = 1; i <= 16; i++) {
  scripts.push(`semantic-${i}.js`);
}
scripts.push("semantic-runtime-fix.js");

window.__SMC = {
  buildBaseSchedule: () => ({}),
  buildHtml: () => "",
  round: x => x
};

for (const scriptName of scripts) {
  const code = fs.readFileSync(`${webDir}/${scriptName}`, 'utf8');
  window.eval(code);
}

const compiler = window.SvgMotionCompiler;
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const compiled = compiler.compile(manifest);

const scriptText = compiled.svg.match(/const D=(\{.*\}),svg/)?.[1];
if (scriptText) {
  const compiledData = JSON.parse(scriptText.replace(/\\u003c/g, '<'));
  
  // Find cyan[1] track
  const track = compiledData.tracks.find(t => t.id.includes('cyan[1]'));
  if (track) {
    console.log(`Track ID: ${track.id}`);
    console.log(`  Tag: ${track.tag}`);
    console.log(`  Present: ${JSON.stringify(track.present)}`);
    console.log(`  PathMode: ${track.pathMode}`);
    console.log(`  Paths:`);
    track.paths.forEach((p, idx) => {
      console.log(`    State ${idx}: ${p ? p.slice(0, 80) + '...' : 'null'}`);
    });
  } else {
    console.log("cyan[1] track not found!");
  }
}
