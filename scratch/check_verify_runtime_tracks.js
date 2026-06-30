const fs = require('fs');
const { JSDOM } = require('jsdom');
const vm = require('vm');

const svg = fs.readFileSync('verify-z-c1/animation.svg', 'utf8');
const dom = new JSDOM(svg);
const doc = dom.window.document;

const scripts = doc.querySelectorAll('script');
let runtimeScript = null;
scripts.forEach(s => {
  if (s.textContent.includes('D.tracks')) {
    runtimeScript = s.textContent;
  }
});

if (runtimeScript) {
  // Let's run it in a sandbox
  const sandbox = {
    document: {
      currentScript: {
        closest: () => null
      }
    },
    performance: {
      now: () => 0
    },
    requestAnimationFrame: () => {}
  };
  vm.createContext(sandbox);
  // Modify the script to assign D to a global variable in sandbox instead of wrapping in IIFE
  // The script starts with `(()=> { const D=...`
  // We can change `const D=` to `sandbox.D=` or just return it.
  // Better: extract the JSON string of D by tracking braces.
  const startIdx = runtimeScript.indexOf('const D=');
  if (startIdx >= 0) {
    let braceCount = 0;
    let jsonStart = startIdx + 8;
    let jsonEnd = -1;
    for (let i = jsonStart; i < runtimeScript.length; i++) {
      if (runtimeScript[i] === '{') {
        braceCount++;
      } else if (runtimeScript[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          jsonEnd = i + 1;
          break;
        }
      }
    }
    if (jsonEnd > 0) {
      const json = runtimeScript.slice(jsonStart, jsonEnd);
      const D = JSON.parse(json);
      console.log('Verify runtime tracks count:', D.tracks.length);
      console.log('Verify runtime tracks IDs:');
      D.tracks.forEach(t => console.log('  ', t.id));
    } else {
      console.log('Could not find matching braces for D');
    }
  } else {
    console.log('Could not find const D=');
  }
} else {
  console.log('No runtime script found in Verify SVG');
}
