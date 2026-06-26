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
  
  console.log("Piechart track details in compiled output:");
  compiledData.tracks.forEach(track => {
    if (track.id.includes('piechart') || track.id.includes('yellow') || track.id.includes('cyan') || track.id.includes('orange') || track.id.includes('blue')) {
      console.log(`\nTrack ID: ${track.id}`);
      console.log(`  Tag: ${track.tag}`);
      console.log(`  Present: ${JSON.stringify(track.present)}`);
      console.log(`  PathMode: ${track.pathMode}`);
      if (track.pathMode) {
        console.log(`  Paths[0]: ${track.paths[0]?.slice(0, 80)}...`);
        console.log(`  Paths[2]: ${track.paths[2]?.slice(0, 80)}...`);
      }
      // Print check if any paths are null
      const nullIndices = track.paths.map((p, i) => p === null ? i : null).filter(x => x !== null);
      if (nullIndices.length > 0) {
        console.log(`  WARNING: Paths are null at states: ${JSON.stringify(nullIndices)}`);
      }
    }
  });
} else {
  console.log("Could not parse compiled data D!");
}
