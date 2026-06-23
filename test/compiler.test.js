"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { compileManifest, sampleSpring, easingToSpline } = require("../src/figma-motion-compiler");

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "../fixtures/motion-manifest.example.json"), "utf8"));
const result = compileManifest(fixture);
assert.ok(result.svg.includes("<linearGradient"));
assert.ok(result.svg.includes('attributeName="x"'));
assert.ok(result.svg.includes('attributeName="stop-color"'));
assert.ok(result.html.includes("setCurrentTime"));
assert.strictEqual(result.report.gradientTracks, 1);
assert.strictEqual(result.report.renderMode, "semantic");
assert.ok(result.schedule.totalDuration > 3);

const snapshotManifest = {
  states: [
    {
      id: "a",
      name: "A",
      width: 100,
      height: 100,
      layers: [],
      svg: '<svg viewBox="0 0 100 100"><defs><clipPath id="clip0"><rect width="50" height="50"/></clipPath></defs><rect id="shape" width="100" height="100" clip-path="url(#clip0)"/></svg>'
    },
    {
      id: "b",
      name: "B",
      width: 100,
      height: 100,
      layers: [],
      svg: '<svg viewBox="0 0 100 100"><defs><clipPath id="clip0"><circle r="25" cx="50" cy="50"/></clipPath></defs><circle id="shape" r="40" cx="50" cy="50" clip-path="url(#clip0)"/></svg>'
    }
  ],
  stateOrder: ["a", "b"],
  startNodeId: "a",
  transitions: [
    { from: "a", to: "b", trigger: { type: "AFTER_TIMEOUT", timeout: 1 }, transition: { duration: 0.3, easing: { type: "EASE_OUT" } } },
    { from: "b", to: "a", trigger: { type: "AFTER_TIMEOUT", timeout: 1 }, transition: { duration: 0.3, easing: { type: "EASE_OUT" } } }
  ]
};
const snapshotResult = compileManifest(snapshotManifest);
assert.strictEqual(snapshotResult.report.renderMode, "snapshot");
assert.strictEqual(snapshotResult.report.snapshotStates, 2);
assert.ok(snapshotResult.svg.includes("snapshot-0-a-clip0"));
assert.ok(snapshotResult.svg.includes("url(#snapshot-1-b-clip0)"));
assert.ok(snapshotResult.svg.includes('data-render-mode="snapshot"'));

assert.strictEqual(sampleSpring({ mass: 1, stiffness: 100, damping: 10 }, 20).length, 20);
assert.strictEqual(easingToSpline({ type: "LINEAR" }), "0 0 1 1");
console.log("compiler.test.js: OK");
