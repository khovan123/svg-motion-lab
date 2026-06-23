"use strict";
const { animate } = require("./timeline");
const { esc, fmt, safeId } = require("./utils");

function hasSnapshots(states) {
  return states.length > 0 && states.every(state => typeof state.svg === "string" && state.svg.includes("<svg"));
}

function dataUri(svg) {
  return "data:image/svg+xml;base64," + Buffer.from(String(svg), "utf8").toString("base64");
}

function renderSnapshots(states, schedule, cfg, report) {
  report.renderMode = "snapshot";
  report.snapshotStates = states.length;
  return states.map((state, index) => {
    const values = states.map((_item, itemIndex) => itemIndex === index ? 1 : 0);
    const id = safeId(state.id || state.name || index);
    const width = fmt(state.width || states[0].width || 1);
    const height = fmt(state.height || states[0].height || 1);
    return `<g id="state-${id}" opacity="${index === 0 ? 1 : 0}"><image x="0" y="0" width="${width}" height="${height}" href="${esc(dataUri(state.svg))}" preserveAspectRatio="none"/>${animate("opacity", values, schedule, cfg)}</g>`;
  }).join("");
}

module.exports = { hasSnapshots, dataUri, renderSnapshots };
