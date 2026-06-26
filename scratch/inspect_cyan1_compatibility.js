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
  const track = compiledData.tracks.find(t => t.id.includes('cyan[1]'));
  if (track) {
    console.log("Analyzing cyan[1] path compatibility:");
    track.paths.forEach((p, idx) => {
      const tokens = String(p || '').match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
      const commands = tokens.filter(x => /^[a-zA-Z]$/.test(x)).join('');
      const numCount = tokens.filter(x => !/^[a-zA-Z]$/.test(x)).length;
      console.log(`  State ${idx}: commands="${commands}" (${commands.length} cmds), numbers=${numCount}`);
      console.log(`    Full path: ${p}`);
    });
  }
}
