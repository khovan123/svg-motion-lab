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
    // Modify matchGeometryGloballyV2 to log only targeted matches
    code = code.replace(
      "if (bestMatch) {\n      matchedNodes.set(layer.stableNodeId, bestMatch);",
      `if (bestMatch) {
        if (layer.stableNodeId.includes('refresh') || layer.stableNodeId.includes('piechart') || layer.stableNodeId.includes('hugeicons')) {
          console.log("MATCHED exact:", layer.stableNodeId, "to <" + bestMatch.tagName + "> d =", bestMatch.getAttribute('d') ? bestMatch.getAttribute('d').slice(0, 50) + '...' : 'null');
        }
        matchedNodes.set(layer.stableNodeId, bestMatch);`
    );
    code = code.replace(
      "if (bestMatch) {\n      matchedNodes.set(layer.stableNodeId, bestMatch);\n      matchedElementsSet.add(bestMatch);",
      `if (bestMatch) {
        if (layer.stableNodeId.includes('refresh') || layer.stableNodeId.includes('piechart') || layer.stableNodeId.includes('hugeicons')) {
          console.log("MATCHED loose:", layer.stableNodeId, "to <" + bestMatch.tagName + "> d =", bestMatch.getAttribute('d') ? bestMatch.getAttribute('d').slice(0, 50) + '...' : 'null');
        }
        matchedNodes.set(layer.stableNodeId, bestMatch);\n      matchedElementsSet.add(bestMatch);`
    );
    // Also log unmatched layers for refresh and piechart
    code = code.replace(
      "if (matchedGroup) {\n      matchedNodes.set(layer.stableNodeId, matchedGroup);",
      `if (matchedGroup) {
        if (layer.stableNodeId.includes('refresh') || layer.stableNodeId.includes('piechart') || layer.stableNodeId.includes('hugeicons')) {
          console.log("MATCHED container group:", layer.stableNodeId, "to <" + matchedGroup.tagName + "> data-motion-id =", matchedGroup.getAttribute('data-motion-id'));
        }
        matchedNodes.set(layer.stableNodeId, matchedGroup);`
    );
    code = code.replace(
      "if (bestMatch) {\n        matchedNodes.set(layer.stableNodeId, bestMatch);",
      `if (bestMatch) {
        if (layer.stableNodeId.includes('refresh') || layer.stableNodeId.includes('piechart') || layer.stableNodeId.includes('hugeicons')) {
          console.log("MATCHED container bestMatch:", layer.stableNodeId, "to <" + bestMatch.tagName + ">");
        }
        matchedNodes.set(layer.stableNodeId, bestMatch);`
    );
  }
  dom.window.eval(code);
}

const compiler = dom.window.SvgMotionCompiler;
console.log("Running compile to trace matching...");
compiler.compile(manifest, { loop: true });
