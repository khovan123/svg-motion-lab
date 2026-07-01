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
function buildManifestIndex(state) {
  const layers = state.layers || [];
  const byParent = new Map();
  for (const layer of layers) {
    const parent = layer.parentStableNodeId || "";
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent).push(layer);
  }
  const root = layers.find(layer => String(layer.stableNodeId || "").endsWith(":@root")) || layers.find(layer => !layer.parentStableNodeId) || null;
  return { layers, byParent, root };
}
function inferSpecialLayers(manifest) {
  const state = manifest.states[0];
  const index = buildManifestIndex(state);
  const rootId = index.root && index.root.stableNodeId;
  const rootChildren = (index.byParent.get(rootId) || []).slice();
  const connector = rootChildren.find(layer => layer.type === "VECTOR" && (layer.strokes || []).length > 0 && (layer.fills || []).length === 0) || null;
  const spinnerContainer = rootChildren.find(layer => {
    if (layer.type !== "FRAME") return false;
    if ((layer.fills || []).length < 2) return false;
    const children = index.byParent.get(layer.stableNodeId) || [];
    return children.length === 1 && children[0].type === "FRAME";
  }) || null;
  const spinnerRotor = spinnerContainer ? (index.byParent.get(spinnerContainer.stableNodeId) || []).find(layer => layer.type === "FRAME") || null : null;
  const pie = rootChildren.find(layer => {
    if (layer.type !== "FRAME") return false;
    if ((layer.fills || []).length || (layer.strokes || []).length || (layer.effects || []).length) return false;
    const children = index.byParent.get(layer.stableNodeId) || [];
    const ellipseCount = children.filter(child => child.type === "ELLIPSE").length;
    const groupCount = children.filter(child => child.type === "GROUP").length;
    return ellipseCount >= 1 && groupCount >= 3;
  }) || null;
  const pieIds = new Set();
  if (pie) {
    const stack = [pie.stableNodeId];
    while (stack.length) {
      const id = stack.pop();
      pieIds.add(id);
      for (const child of index.byParent.get(id) || []) {
        stack.push(child.stableNodeId);
      }
    }
  }
  const barChart = rootChildren.find(layer => {
    if (layer.type !== "FRAME") return false;
    const children = index.byParent.get(layer.stableNodeId) || [];
    return children.length === 4 && children.every(child => child.type === "FRAME");
  }) || null;
  let firstBarActive = null;
  let firstColumnBounds = null;
  if (barChart) {
    const columns = (index.byParent.get(barChart.stableNodeId) || []).slice().sort((a, b) => a.bounds.x - b.bounds.x);
    const firstColumn = columns[0];
    firstBarActive = ((index.byParent.get(firstColumn.stableNodeId) || []).filter(layer => layer.type === "RECTANGLE" && (layer.fills || []).length > 0).sort((a, b) => a.bounds.height - b.bounds.height))[0] || null;
    firstColumnBounds = firstColumn && firstColumn.bounds;
  }
  return {
    connectorId: connector && connector.stableNodeId,
    spinnerContainerId: spinnerContainer && spinnerContainer.stableNodeId,
    spinnerRotorId: spinnerRotor && spinnerRotor.stableNodeId,
    spinnerContainerBounds: spinnerContainer && spinnerContainer.bounds,
    pieIds,
    firstBarActiveId: firstBarActive && firstBarActive.stableNodeId,
    firstColumnBounds
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
const avatarDoc = new JSDOM(avatarResult.svg, { contentType: "image/svg+xml" }).window.document;
avatarDoc.querySelectorAll('[data-motion-id*="@root/piechart["], [data-exact-ring]').forEach(node => {
  assert.ok(!node.hasAttribute("filter"), "pie chart containers should not keep direct filter attributes");
  node.querySelectorAll("[filter]").forEach(child => {
    assert.fail("pie chart/exact ring descendants should not keep filter attributes");
  });
});

const liveManifest = JSON.parse(fs.readFileSync(path.join(__dirname, "../motion-manifest.json"), "utf8"));
const liveSpecialLayers = inferSpecialLayers(liveManifest);
const liveResult = compileManifest(liveManifest);
const liveDoc = new JSDOM(liveResult.svg, { contentType: "image/svg+xml" }).window.document;
const liveRuntimeMatch = liveResult.svg.match(/const D=(\{.*?\}),svg=/s);
assert.ok(liveRuntimeMatch, "live manifest should embed runtime data");
const liveRuntimeData = JSON.parse(liveRuntimeMatch[1]);
const livePieNodes = [...liveDoc.querySelectorAll("[data-motion-id], [data-exact-ring]")].filter(node => {
  if (node.hasAttribute("data-exact-ring")) return true;
  const motionId = node.getAttribute("data-motion-id");
  return motionId && liveSpecialLayers.pieIds.has(motionId);
});
livePieNodes.forEach(node => {
  assert.ok(!node.hasAttribute("filter"), "live pie chart containers should not keep direct filter attributes");
  node.querySelectorAll("[filter]").forEach(child => {
    assert.fail("live pie chart descendants should not keep filter attributes");
  });
});
const liveExactRing = liveDoc.querySelector("[data-exact-ring]");
assert.ok(liveExactRing, "live manifest should emit the exact pie ring wrapper");
const liveRingSlots = [...liveExactRing.querySelectorAll("[data-ring-slot]")];
assert.strictEqual(liveRingSlots.length, 4, "live manifest should emit four persistent semantic pie slices");
assert.strictEqual(liveResult.report.ringSlotCount, liveRingSlots.length, "reported ring slot count should match emitted semantic slices");
assert.strictEqual(liveResult.report.ringStateSourceCount, liveManifest.stateOrder.length, "ring runtime should track the original frame count");
assert.strictEqual(liveResult.report.ringStateDedupedCount, liveManifest.stateOrder.length, "reported ring state count should match the sampled manifest states");
const liveRingScript = [...liveDoc.querySelectorAll("script")].find(node => (node.textContent || "").includes("[data-ring-slot]"));
assert.ok(liveRingScript, "live manifest should embed a semantic exact ring runtime");
const liveRingRuntimeMatch = (liveRingScript.textContent || "").match(/const D=(\{.*?\}),svg=/s);
assert.ok(liveRingRuntimeMatch, "semantic exact ring runtime should embed its state samples");
const liveRingRuntimeData = JSON.parse(liveRingRuntimeMatch[1]);
assert.strictEqual(liveRingRuntimeData.states.length, liveManifest.stateOrder.length, "semantic ring runtime should preserve one sampled state per frame");
liveManifest.stateOrder.forEach((stateId, index) => {
  const sourceState = liveManifest.states.find(state => state.id === stateId);
  assert.ok(sourceState, `live manifest should contain source state ${stateId}`);
  const normalizedSourceSvg = String(sourceState.svg || "").replace(new RegExp(stateId.replace(/:/g, "_"), "g"), "motion_shared");
  const sourceDoc = new JSDOM(normalizedSourceSvg, { contentType: "image/svg+xml" }).window.document;
  const expectedPaths = [...sourceDoc.querySelectorAll("g[mask] path")].map(pathNode => (pathNode.getAttribute("d") || "").replace(/\s+/g, " ").trim());
  const normalizeFillRef = value => String(value || "").replace(/_state\d+/g, "_state").replace(/_state(?![a-zA-Z0-9_-])/g, "").replace(/\s+/g, " ").trim();
  const expectedFills = [...sourceDoc.querySelectorAll("g[mask] path")].map(pathNode => normalizeFillRef(pathNode.getAttribute("fill") || ""));
  const actualPaths = liveRingRuntimeData.states[index].map(sample => (sample.d || "").replace(/\s+/g, " ").trim());
  const actualFills = liveRingRuntimeData.states[index].map(sample => normalizeFillRef(sample.fill || ""));
  assert.deepStrictEqual(actualPaths, expectedPaths, `exact pie ring state ${index} should preserve the masked pie paths exported from manifest state ${stateId}`);
  assert.deepStrictEqual(actualFills, expectedFills, `exact pie ring state ${index} should preserve the manifest pie fills for ${stateId}`);
});
const liveExactRingStaticChildren = [...liveExactRing.children].filter(node => !node.hasAttribute("data-ring-slot"));
assert.ok(liveExactRingStaticChildren.length <= 1, "exact pie ring should only hoist one shared static shell");
assert.strictEqual(liveResult.report.ringStateCount, liveManifest.stateOrder.length, "reported ring state count should describe the sampled manifest states");
assert.ok(liveResult.svg.includes("slot.setAttribute('visibility',sample?'visible':'hidden')"), "exact pie ring runtime should update persistent semantic slices instead of crossfading subtree snapshots");
assert.ok(liveResult.svg.includes("swapBar=/^@root\\/bar-chart\\[0\\]\\/.*\\/(?:background|active)\\[0\\]$/"), "bar chart runtime should swap sampled bar states instead of interpolating active colors");
liveExactRingStaticChildren.forEach(node => {
  const markup = node.outerHTML || "";
  assert.ok(/opacity="0\.9"/.test(markup), "shared pie shell should preserve the donut shell opacity");
});
liveExactRing.querySelectorAll("[data-motion-id]").forEach(node => {
  const motionId = node.getAttribute("data-motion-id") || "";
  assert.ok(!motionId.includes("@root/bar-chart["), "exact pie ring should not leak bar chart nodes into pie sample states");
});
const unresolvedSharedRefs = new Set();
[liveExactRing, ...liveRingSlots].forEach(node => {
  [node, ...node.querySelectorAll("*")].forEach(child => {
    ["fill", "stroke", "filter", "clip-path", "mask", "href", "xlink:href", "style"].forEach(name => {
      const value = child.getAttribute && child.getAttribute(name);
      if (!value) return;
      value.replace(/url\(#([^)]+)\)/g, (match, id) => {
        if (/_motion_shared$/.test(id)) unresolvedSharedRefs.add(id);
        return match;
      });
      if ((name === "href" || name === "xlink:href") && /^#.+/.test(value) && /_motion_shared$/.test(value.slice(1))) {
        unresolvedSharedRefs.add(value.slice(1));
      }
    });
  });
});
assert.deepStrictEqual([...unresolvedSharedRefs], [], "exact pie ring should rewrite normalized shared refs to concrete state defs");
const firstBarTrack = liveRuntimeData.tracks.find(track => track.id === liveSpecialLayers.firstBarActiveId);
assert.ok(firstBarTrack, "live manifest should contain first bar active track");
assert.ok(firstBarTrack.transforms[2][5] > liveSpecialLayers.firstColumnBounds.y + liveSpecialLayers.firstColumnBounds.height - 12, "first bar collapsed transform should stay anchored near the baseline like the other bars");
const spinnerContainer = [...liveDoc.querySelectorAll("[data-motion-id]")].find(node => node.getAttribute("data-motion-id") === liveSpecialLayers.spinnerContainerId);
assert.ok(spinnerContainer, "live manifest should preserve spinner container output");
assert.strictEqual(spinnerContainer.tagName.toLowerCase(), "g", "spinner container should compile as a wrapper group");
const spinnerRotor = [...spinnerContainer.querySelectorAll("[data-motion-id], [data-refresh-rotor]")].find(node => node.hasAttribute("data-refresh-rotor") || node.getAttribute("data-motion-id") === liveSpecialLayers.spinnerRotorId);
assert.ok(spinnerRotor, "spinner container should keep the refresh rotor inside the wrapper");
const spinnerBackgrounds = [...spinnerContainer.children].filter(child => {
  const bounds = getPathBounds(child.getAttribute("d") || "");
  return Math.abs(bounds.width - liveSpecialLayers.spinnerContainerBounds.width) < 1 && Math.abs(bounds.height - liveSpecialLayers.spinnerContainerBounds.height) < 1;
});
assert.ok(spinnerBackgrounds.length >= 2, "spinner container should keep both 64x64 card background layers");
console.log("compiler.test.js: OK");
