"use strict";
const fs = require("fs");
const path = require("path");
const { orderStates, sampleSpring, easingSpline } = require("./compiler/timeline");
const { tracks, renderTrack } = require("./compiler/render");
const { hasSnapshots, renderSnapshots } = require("./compiler/snapshot");
const { buildPrototypeIR, buildAutoplay } = require("./compiler/prototype");
const renderHtml = require("./compiler/html");
const { finite, fmt } = require("./compiler/utils");

const DEFAULTS = {
  defaultHold: 0.7,
  defaultDuration: 0.4,
  springSamples: 36,
  precision: 4,
  loop: true,
  renderMode: "prototype"
};

function validate(manifest) {
  if (!manifest || !Array.isArray(manifest.states) || !manifest.states.length) {
    throw new Error("Manifest phải có ít nhất một state.");
  }
  for (const state of manifest.states) {
    if (!state.id || !Array.isArray(state.layers)) {
      throw new Error(`State không hợp lệ: ${state && state.name || "unknown"}`);
    }
  }
}

function compileManifest(manifest, options = {}) {
  validate(manifest);
  const cfg = { ...DEFAULTS, ...(manifest.calibration || {}), ...options };
  const states = orderStates(manifest);
  const prototype = buildPrototypeIR(manifest, states);
  const schedule = buildAutoplay(states, prototype, cfg);
  const byId = new Map(states.map(state => [state.id, state]));
  const scheduledStates = schedule.stateIds.map(id => byId.get(id)).filter(Boolean);
  const defs = [];
  const body = [];
  const report = {
    renderMode: "semantic",
    matchedLayers: 0,
    fallbackLayers: 0,
    gradientTracks: 0,
    pathMorphs: 0,
    snapshotStates: 0,
    prototypeReactions: prototype.reactions.length,
    unsupportedActions: prototype.unsupportedActions,
    warnings: []
  };

  const snapshotMode = cfg.renderMode !== "semantic" && hasSnapshots(scheduledStates);
  if (snapshotMode) {
    body.push(renderSnapshots(scheduledStates, schedule, cfg, report));
  } else {
    for (const track of tracks(scheduledStates)) {
      const output = renderTrack(track, schedule, cfg, defs, report);
      if (output) body.push(output);
    }
  }

  if (!schedule.segments.length) {
    report.warnings.push("Prototype không có AFTER_TIMEOUT path; SVG giữ state đầu, HTML runtime vẫn xử lý trigger tương tác.");
  }
  for (const item of prototype.unsupportedActions) {
    report.warnings.push(`Prototype action chưa được runtime hỗ trợ: ${item.type}`);
  }

  const first = byId.get(prototype.startStateId) || states[0];
  const width = finite(first.width, 355);
  const height = finite(first.height, 240);
  const duration = schedule.totalDuration;
  const svg = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg id="motion-svg" viewBox="0 0 ${fmt(width)} ${fmt(height)}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Figma prototype animation" data-duration="${fmt(duration)}" data-render-mode="${report.renderMode}">`,
    "<defs>",
    ...defs,
    "</defs>",
    `<g id="motion-scene">${body.join("")}</g>`,
    "</svg>",
    ""
  ].join("\n");

  const html = renderHtml({ states, prototype, width, height, report });
  return { svg, html, report, schedule, prototype };
}

function compileFile(file, options = {}) {
  const manifest = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
  return compileManifest(manifest, options);
}

module.exports = {
  DEFAULTS,
  compileManifest,
  compileFile,
  orderStates,
  buildPrototypeIR,
  buildAutoplay,
  sampleSpring,
  easingToSpline: easingSpline
};
