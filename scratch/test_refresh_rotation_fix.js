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
  if (s === "semantic-15.js") {
    // Inject our fix in compile function
    const target = "const tracks=[...ids].map(id=>buildTrack(id,states.map(state=>state.map.get(id)||null),layerMaps.map(map=>map.get(id)||null),states)).filter(Boolean);";
    const replacement = target + `
  // Identify rotating groups
  const rotatingGroupIds = new Set();
  tracks.forEach(t => {
    if (t.tag === 'g' && t.rotations) {
      const hasRotation = t.rotations.some(r => r && r.angle !== 0);
      if (hasRotation) {
        rotatingGroupIds.add(t.id);
      }
    }
  });
  console.log("Found rotating groups:", [...rotatingGroupIds]);
  // Disable pathMode for descendants of rotating groups to prevent double-rotation and distortion
  tracks.forEach(t => {
    if (t.tag === 'path') {
      const isDescendant = [...rotatingGroupIds].some(groupId => t.id.startsWith(groupId + '/'));
      if (isDescendant) {
        console.log("Disabling pathMode for descendant track:", t.id);
        t.pathMode = false;
      }
    }
  });`;
    code = code.replace(target, replacement);
  }
  dom.window.eval(code);
}

const compiler = dom.window.SvgMotionCompiler;
const result = compiler.compile(manifest, { loop: true });

console.log("\nCompiled tracks containing hugeiconsrefresh:");
const data = JSON.parse(result.svg.match(/const D=(\{[\s\S]*?\}),svg/)[1]);
data.tracks.forEach(t => {
  if (t.id.includes('hugeiconsrefresh')) {
    console.log(`Track ID: ${t.id}`);
    console.log(`  Tag: ${t.tag}`);
    console.log(`  pathMode: ${t.pathMode}`);
  }
});
