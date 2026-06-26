const fs = require('fs');
const { JSDOM } = require('jsdom');

// Let's load the JSDOM environment and the compiler script
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

// Compile manifest
const compiled = compiler.compile(manifest);

// Inspect the D object in the generated SVG script tag
const scriptText = compiled.svg.match(/const D=(\{.*\}),svg/)?.[1];
if (scriptText) {
  const compiledData = JSON.parse(scriptText.replace(/\\u003c/g, '<'));
  const track = compiledData.tracks.find(t => t.id.includes('background[1]'));
  if (track) {
    console.log(`Track ID: ${track.id}`);
    console.log(`  Tag: ${track.tag}`);
    console.log(`  Present: ${JSON.stringify(track.present)}`);
    console.log(`  PathMode: ${track.pathMode}`);
    console.log(`  Paths: ${JSON.stringify(track.paths.map(p => p ? p.slice(0, 70) + "..." : null))}`);
    
    // Let's check numeric attributes in all states
    console.log(`  Numeric attributes:`);
    track.numeric.forEach((n, idx) => {
      console.log(`    State ${idx}: ${JSON.stringify(n)}`);
    });
    
    // Let's check actual SVG nodes for background[1] in each state
    console.log(`  Original elements in each state:`);
    const states = manifest.states.map(state => {
      const doc = new dom.window.DOMParser().parseFromString(state.svg, 'image/svg+xml');
      return doc.querySelector('[data-motion-id*="background[1]"]');
    });
    states.forEach((el, idx) => {
      if (el) {
        console.log(`    State ${idx} Element: tag=${el.tagName.toLowerCase()}, d=${el.getAttribute('d')?.slice(0, 50)}`);
      } else {
        console.log(`    State ${idx} Element: NOT FOUND!`);
      }
    });
  } else {
    console.log("No track for background[1] found in compiled data!");
  }
}
