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
  renderMode: "auto"
};

function schemaVersion(manifest) {
  const match = String(manifest && manifest.schema || "").match(/@(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function complexVisualLayers(states) {
  const result = [];
  for (const state of states || []) {
    for (const layer of state.layers || []) {
      const name = String(layer.name || "");
      const type = String(layer.type || "");
      if (
        type === "BOOLEAN_OPERATION" ||
        type === "SLICE" ||
        (type === "GROUP" && /mask|clip|filter/i.test(name))
      ) {
        result.push({ stateId: state.id, key: layer.key || layer.semanticPath || layer.id, type, name });
      }
    }
  }
  return result;
}

function preflight(manifest, options = {}) {
  if (!manifest || !Array.isArray(manifest.states) || !manifest.states.length) {
    throw new Error("Manifest phải có ít nhất một state.");
  }
  for (const state of manifest.states) {
    if (!state.id || !Array.isArray(state.layers)) {
      throw new Error(`State không hợp lệ: ${state && state.name || "unknown"}`);
    }
  }

  const version = schemaVersion(manifest);
  const prototypeReady = Boolean(manifest.prototype && Array.isArray(manifest.prototype.reactions));
  const snapshotsReady = hasSnapshots(manifest.states);
  const requestedMode = options.renderMode || manifest.calibration && manifest.calibration.renderMode || (prototypeReady ? "prototype" : "semantic");
  const complex = complexVisualLayers(manifest.states);

  if (requestedMode === "prototype") {
    if (version < 3 || !prototypeReady) {
      throw new Error(
        `Manifest ${manifest.schema || "không rõ schema"} chưa phải prototype-first v3. ` +
        "Hãy reload plugin có main=prototype-code.js rồi export lại; file đúng phải có schema svg-motion-lab/figma-manifest@3 và object prototype."
      );
    }
    if (!snapshotsReady) {
      const missing = manifest.states.filter(state => !state.svg).map(state => state.name || state.id);
      throw new Error(
        `Prototype manifest thiếu SVG snapshot ở ${missing.length} state: ${missing.slice(0, 4).join(", ")}${missing.length > 4 ? "…" : ""}. ` +
        "Exporter v3 luôn bật snapshot; hãy export lại thay vì build semantic fallback."
      );
    }
  }

  if (!snapshotsReady && complex.length) {
    const sample = complex.slice(0, 4).map(layer => `${layer.key} (${layer.type})`).join(", ");
    throw new Error(
      `Không thể build chính xác vì manifest không có SVG snapshot nhưng chứa layer phức tạp: ${sample}${complex.length > 4 ? "…" : ""}. ` +
      "Semantic renderer sẽ làm mất mask/clip/filter. Hãy dùng exporter schema v3 và export lại với snapshot bắt buộc."
    );
  }

  return {
    version,
    prototypeReady,
    snapshotsReady,
    complexVisualLayers: complex,
    renderMode: requestedMode
  };
}

function compileManifestV4(manifest, options = {}) {
  const { JSDOM } = require("jsdom");
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    runScripts: "dangerously"
  });
  const { window } = dom;

  if (!window.CSS) window.CSS = {};
  if (!window.CSS.escape) {
    window.CSS.escape = function (value) {
      return String(value).replace(/([^\w-])/g, "\\$1");
    };
  }

  const webDir = path.join(__dirname, "../web");
  const scripts = [
    "semantic-1.js", "semantic-2.js", "semantic-3.js", "semantic-4.js", "semantic-5.js",
    "semantic-6.js", "semantic-7.js", "semantic-8.js", "semantic-9.js", "semantic-10.js",
    "semantic-11.js", "semantic-12.js", "semantic-15.js", "semantic-13.js", "semantic-14.js",
    "semantic-16.js", "semantic-runtime-fix.js"
  ];

  for (const scriptName of scripts) {
    const code = fs.readFileSync(path.join(webDir, scriptName), "utf8");
    window.eval(code);
  }

  const compiler = window.SvgMotionCompiler;
  if (!compiler) {
    throw new Error("Không thể khởi tạo SvgMotionCompiler từ các file web.");
  }

  const baseSchedule = compiler.buildBaseSchedule(manifest);
  const customSegments = options.customSegments || [];
  const infinite = options.loop !== false;

  const outputs = compiler.compile(manifest, {
    baseSchedule,
    customSegments,
    infinite
  });

  const report = outputs.report.report || {};
  report.prototypeReactions = manifest.prototype && Array.isArray(manifest.prototype.reactions)
    ? manifest.prototype.reactions.length
    : 0;

  return {
    svg: outputs.svg,
    html: outputs.html,
    prototype: outputs.ir,
    report: report,
    schedule: outputs.report.schedule
  };
}

function compileManifest(manifest, options = {}) {
  if (manifest && manifest.schema === "svg-motion-lab/figma-manifest@4") {
    return compileManifestV4(manifest, options);
  }
  const readiness = preflight(manifest, options);
  const cfg = {
    ...DEFAULTS,
    ...(manifest.calibration || {}),
    ...options,
    renderMode: readiness.renderMode
  };
  const states = orderStates(manifest);
  const prototype = buildPrototypeIR(manifest, states);
  const schedule = buildAutoplay(states, prototype, cfg);
  const byId = new Map(states.map(state => [state.id, state]));
  const scheduledStates = schedule.stateIds.map(id => byId.get(id)).filter(Boolean);
  const defs = [];
  const body = [];
  const report = {
    manifestSchema: manifest.schema || null,
    manifestVersion: readiness.version,
    prototypeReady: readiness.prototypeReady,
    snapshotsReady: readiness.snapshotsReady,
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

  const html = renderHtml({ states, prototype, width, height, report, svg, duration });
  return { svg, html, report, schedule, prototype };
}

function compileFile(file, options = {}) {
  const manifest = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
  return compileManifest(manifest, options);
}

module.exports = {
  DEFAULTS,
  schemaVersion,
  complexVisualLayers,
  preflight,
  compileManifest,
  compileFile,
  orderStates,
  buildPrototypeIR,
  buildAutoplay,
  sampleSpring,
  easingToSpline: easingSpline
};
