"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { compileManifest, sampleSpring, easingToSpline } = require("../src/figma-motion-compiler");

const pluginMain = fs.readFileSync(path.join(__dirname, "../figma-plugin/prototype-code.js"), "utf8");
assert.ok(!pluginMain.includes("?."), "Figma plugin main must not use optional chaining");
assert.ok(!pluginMain.includes("??"), "Figma plugin main must not use nullish coalescing");

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "../fixtures/motion-manifest.example.json"), "utf8"));
const result = compileManifest(fixture);
assert.ok(result.svg.includes("<linearGradient"));
assert.ok(result.svg.includes('attributeName="x"'));
assert.ok(result.svg.includes('attributeName="stop-color"'));
assert.ok(result.html.includes("setCurrentTime"));
assert.strictEqual(result.report.gradientTracks, 1);
assert.strictEqual(result.report.renderMode, "semantic");
assert.strictEqual(result.prototype.reactions.length, 3);
assert.ok(result.schedule.totalDuration > 3);

const svgA = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><clipPath id="clip"><circle cx="50" cy="50" r="30"/></clipPath></defs><rect width="100" height="100" fill="red" clip-path="url(#clip)"/></svg>';
const svgB = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><filter id="blur"><feGaussianBlur stdDeviation="2"/></filter></defs><circle cx="50" cy="50" r="40" fill="blue" filter="url(#blur)"/></svg>';
const prototypeManifest = {
  schema: "svg-motion-lab/figma-manifest@3",
  startNodeId: "a",
  stateOrder: ["a", "b"],
  states: [
    { id: "a", name: "A", width: 100, height: 100, layers: [], svg: svgA },
    { id: "b", name: "B", width: 100, height: 100, layers: [], svg: svgB }
  ],
  prototype: {
    startStateId: "a",
    flowStartingPoints: [{ nodeId: "a", stateId: "a", name: "Flow 1" }],
    reactions: [
      {
        id: "r1",
        sourceStateId: "a",
        sourceNodeId: "button-a",
        sourceLayerKey: "button",
        trigger: { type: "AFTER_TIMEOUT", timeout: 0.5 },
        actions: [{ type: "NODE", destinationId: "b", destinationStateId: "b", transition: { type: "SMART_ANIMATE", duration: 0.4, easing: { type: "EASE_OUT" } } }]
      },
      {
        id: "r2",
        sourceStateId: "b",
        sourceNodeId: "button-b",
        sourceLayerKey: "button",
        trigger: { type: "ON_CLICK" },
        actions: [{ type: "NODE", destinationId: "a", destinationStateId: "a", transition: { type: "INSTANT", duration: 0 } }]
      }
    ],
    variables: [],
    variableCollections: []
  },
  calibration: { renderMode: "prototype" }
};

const prototypeResult = compileManifest(prototypeManifest);
assert.strictEqual(prototypeResult.report.renderMode, "snapshot");
assert.strictEqual(prototypeResult.report.snapshotStates, 2);
assert.strictEqual(prototypeResult.report.prototypeReady, true);
assert.strictEqual(prototypeResult.report.snapshotsReady, true);
assert.strictEqual(prototypeResult.prototype.startStateId, "a");
assert.strictEqual(prototypeResult.schedule.stateIds.join(","), "a,b");
assert.ok(prototypeResult.svg.includes("data:image/svg+xml;base64,"));
assert.ok(prototypeResult.html.includes("reactionsByState"));
assert.ok(prototypeResult.html.includes("AFTER_TIMEOUT"));
assert.ok(prototypeResult.html.includes("ON_CLICK"));

const staleComplexManifest = {
  schema: "svg-motion-lab/figma-manifest@2",
  startNodeId: "old",
  stateOrder: ["old"],
  states: [{
    id: "old",
    name: "Old",
    width: 100,
    height: 100,
    layers: [{ id: "mask", key: "@root/mask-group[0]", name: "Mask group", type: "GROUP", bounds: { x: 0, y: 0, width: 100, height: 100 } }]
  }],
  transitions: [],
  calibration: { renderMode: "auto" }
};
assert.throws(
  () => compileManifest(staleComplexManifest),
  /schema v3|SVG snapshot|layer phức tạp/i
);

assert.strictEqual(sampleSpring({ mass: 1, stiffness: 100, damping: 10 }, 20).length, 20);
assert.strictEqual(easingToSpline({ type: "LINEAR" }), "0 0 1 1");
console.log("compiler.test.js: OK");
