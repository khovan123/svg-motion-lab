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

function getPathBounds(d) {
  const tokens = String(d || "").match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let cx = 0;
  let cy = 0;
  const update = (x, y) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  };

  for (let i = 0; i < tokens.length;) {
    const token = tokens[i++];
    if (!/^[a-zA-Z]$/.test(token)) continue;
    if (token === "M" || token === "L" || token === "T") {
      cx = Number(tokens[i++]);
      cy = Number(tokens[i++]);
      update(cx, cy);
    } else if (token === "H") {
      cx = Number(tokens[i++]);
      update(cx, cy);
    } else if (token === "V") {
      cy = Number(tokens[i++]);
      update(cx, cy);
    } else if (token === "C") {
      const x1 = Number(tokens[i++]);
      const y1 = Number(tokens[i++]);
      const x2 = Number(tokens[i++]);
      const y2 = Number(tokens[i++]);
      cx = Number(tokens[i++]);
      cy = Number(tokens[i++]);
      update(x1, y1);
      update(x2, y2);
      update(cx, cy);
    } else if (token === "S" || token === "Q") {
      const x1 = Number(tokens[i++]);
      const y1 = Number(tokens[i++]);
      cx = Number(tokens[i++]);
      cy = Number(tokens[i++]);
      update(x1, y1);
      update(cx, cy);
    } else if (token === "A") {
      i += 5;
      cx = Number(tokens[i++]);
      cy = Number(tokens[i++]);
      update(cx, cy);
    } else if (token === "Z") {
      continue;
    }
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

const rootManifest = JSON.parse(fs.readFileSync(path.join(__dirname, "../fixtures/progress-bar-manifest.json"), "utf8"));
const rootResult = compileManifest(rootManifest);
const rootRuntimeMatch = rootResult.svg.match(/const D=(\{.*?\}),svg=/s);
assert.ok(rootRuntimeMatch, "root manifest should embed runtime data");
const rootRuntimeData = JSON.parse(rootRuntimeMatch[1]);
const { JSDOM } = require("jsdom");
const rootDoc = new JSDOM(rootResult.svg, { contentType: "image/svg+xml" }).window.document;
const barEl = rootDoc.querySelector('[data-motion-id="1:4475:@root/bar[0]"]');
const activeEl = rootDoc.querySelector('[data-motion-id="1:4475:@root/active[0]"]');
const cardBgEl = rootDoc.querySelector('[data-motion-id="1:4475:@root/doc-icon[0]/background[0]"]');
assert.ok(barEl, "root manifest should compile a progress track");
assert.ok(activeEl, "root manifest should compile an active progress fill");
assert.ok(cardBgEl, "root manifest should preserve icon card background mapping");
assert.ok(/^url\(#/.test(barEl.getAttribute("fill") || ""), "progress track should keep its gradient fill");
assert.ok(/^url\(#/.test(activeEl.getAttribute("fill") || ""), "active progress fill should keep its gradient fill");
assert.ok(rootResult.svg.includes("referencedColorInterpolation"), "root manifest should opt into referenced color interpolation for line transitions");
const barTrack = rootRuntimeData.tracks.find(track => track.id === "1:4475:@root/bar[0]");
assert.ok(barTrack, "root manifest should keep runtime track data for bar");
assert.strictEqual(new Set(barTrack.colors.map(colorSet => colorSet && colorSet.fill).filter(Boolean)).size, 1, "equivalent bar gradients should be normalized to one paint ref");
const barBounds = getPathBounds(barEl.getAttribute("d"));
const activeBounds = getPathBounds(activeEl.getAttribute("d"));
const cardBounds = getPathBounds(cardBgEl.getAttribute("d"));
assert.ok(barBounds.width > 300 && barBounds.height >= 19, "progress track should stay full width near the bottom bar");
assert.ok(activeBounds.width < 1 && activeBounds.height >= 19, "active progress fill should start nearly empty");
assert.ok(cardBounds.width > 60 && cardBounds.width < 70 && cardBounds.y < 120, "icon card background should stay mapped to the top card");
assert.ok(!result.svg.includes("referencedColorInterpolation"), "generic fixture should keep legacy referenced color snapping");
assert.ok(!rootResult.svg.includes("ensurePaintDef"), "root manifest should avoid runtime gradient helper defs that can cause flashing");

const avatarManifest = JSON.parse(fs.readFileSync(path.join(__dirname, "../correct-result/3/motion-manifest.json"), "utf8"));
const avatarResult = compileManifest(avatarManifest);
assert.ok(avatarResult.svg.includes("pattern0_motion_shared_state0"), "avatar manifest should preserve avatar pattern defs");
assert.ok(avatarResult.svg.includes("image0_motion_shared_state0"), "avatar manifest should preserve image defs referenced by avatar patterns");
assert.ok(avatarResult.svg.includes("data:image/png;base64,"), "avatar manifest should keep embedded avatar image data");
console.log("compiler.test.js: OK");
