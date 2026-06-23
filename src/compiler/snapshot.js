"use strict";
const { animate } = require("./timeline");
const { safeId } = require("./utils");

const COMPLEX_SVG = /<(?:mask|clipPath|filter|pattern|image|foreignObject)\b/i;

function hasSnapshots(states) {
  return states.length > 0 && states.every(state => typeof state.svg === "string" && /<svg\b/i.test(state.svg));
}

function shouldUseSnapshotMode(states, cfg) {
  if (cfg.renderMode === "snapshot") return true;
  if (cfg.renderMode === "semantic") return false;
  return hasSnapshots(states) && states.some(state => COMPLEX_SVG.test(state.svg));
}

function extractSvgBody(svg) {
  const match = String(svg || "").match(/<svg\b[^>]*>([\s\S]*?)<\/svg>\s*$/i);
  if (!match) throw new Error("SVG snapshot không hợp lệ.");
  return match[1];
}

function namespaceSvg(svg, prefix) {
  const body = extractSvgBody(svg);
  const ids = [];
  body.replace(/\bid=(['"])([^'"]+)\1/g, (_all, _quote, id) => {
    ids.push(id);
    return _all;
  });
  let output = body;
  for (const id of [...new Set(ids)].sort((a, b) => b.length - a.length)) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const next = `${prefix}-${safeId(id)}`;
    output = output
      .replace(new RegExp(`\\bid=(['"])${escaped}\\1`, "g"), `id="${next}"`)
      .replace(new RegExp(`url\\(#${escaped}\\)`, "g"), `url(#${next})`)
      .replace(new RegExp(`((?:xlink:)?href)=(['"])#${escaped}\\2`, "g"), `$1="#${next}"`)
      .replace(new RegExp(`(aria-labelledby|aria-describedby)=(['"])([^'"]*\\b)${escaped}(\\b[^'"]*)\\2`, "g"), `$1=$2$3${next}$4$2`);
  }
  return output;
}

function renderSnapshots(states, schedule, cfg, report) {
  report.renderMode = "snapshot";
  report.snapshotStates = states.length;
  report.warnings.push("Complex SVG detected: preserving exact Figma snapshots and crossfading states. Semantic morphing remains disabled for masks, filters and clip paths.");
  return states.map((state, index) => {
    const prefix = `snapshot-${index}-${safeId(state.id || state.name || index)}`;
    const values = states.map((_other, stateIndex) => stateIndex === index ? 1 : 0);
    return `<g id="${prefix}" opacity="${index === 0 ? 1 : 0}">${namespaceSvg(state.svg, prefix)}${animate("opacity", values, schedule, cfg)}</g>`;
  }).join("");
}

module.exports = { hasSnapshots, shouldUseSnapshotMode, namespaceSvg, renderSnapshots };
