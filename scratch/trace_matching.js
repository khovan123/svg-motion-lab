const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

// Load compiler scripts to get matchGeometryGloballyV2 code
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
    // Modify matchGeometryGloballyV2 to log the matching process
    code = code.replace(
      "if (boundsMatch) {",
      `console.log("  Candidate for exact match:", el.tagName, "bounds SVG:", JSON.stringify(bSVG), "bounds Layer:", JSON.stringify(bLayer), "diff:", diff);
      if (boundsMatch) {`
    );
    code = code.replace(
      "if (bestMatch) {\n      matchedNodes.set(layer.stableNodeId, bestMatch);",
      `if (bestMatch) {\n      console.log("-> MATCHED exact:", layer.stableNodeId, "to", bestMatch.tagName, "d =", bestMatch.getAttribute('d') ? bestMatch.getAttribute('d').slice(0, 50) + '...' : 'null');\n      matchedNodes.set(layer.stableNodeId, bestMatch);`
    );
    code = code.replace(
      "if (isInside && (layer.name.toLowerCase().includes('yellow') || layer.name.toLowerCase().includes('cyan') || layer.name.toLowerCase().includes('blue') || layer.name.toLowerCase().includes('orange') || layer.type === 'ELLIPSE' || layer.type === 'TEXT')) {",
      `console.log("  Candidate for loose match:", el.tagName, "bounds SVG:", JSON.stringify(bSVG), "bounds Layer:", JSON.stringify(bLayer), "isInside:", isInside);
      if (isInside && (layer.name.toLowerCase().includes('yellow') || layer.name.toLowerCase().includes('cyan') || layer.name.toLowerCase().includes('blue') || layer.name.toLowerCase().includes('orange') || layer.type === 'ELLIPSE' || layer.type === 'TEXT')) {`
    );
    code = code.replace(
      "if (bestMatch) {\n      matchedNodes.set(layer.stableNodeId, bestMatch);\n      matchedElementsSet.add(bestMatch);",
      `if (bestMatch) {\n      console.log("-> MATCHED loose:", layer.stableNodeId, "to", bestMatch.tagName, "d =", bestMatch.getAttribute('d') ? bestMatch.getAttribute('d').slice(0, 50) + '...' : 'null');\n      matchedNodes.set(layer.stableNodeId, bestMatch);\n      matchedElementsSet.add(bestMatch);`
    );
  }
  dom.window.eval(code);
}

const compiler = dom.window.SvgMotionCompiler;
console.log("Running compile to trace matching...");
compiler.compile(manifest, { loop: true });
