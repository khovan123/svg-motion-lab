#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const { compileFile } = require("./src/figma-motion-compiler");

function parse(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--manifest") options.manifest = argv[++index];
    else if (value === "--out-dir") options.outDir = argv[++index];
    else if (value === "--mode") options.renderMode = argv[++index];
    else if (value === "--hold") options.defaultHold = Number(argv[++index]);
    else if (value === "--duration") options.defaultDuration = Number(argv[++index]);
    else if (value === "--spring-samples") options.springSamples = Number(argv[++index]);
    else if (value === "--no-loop") options.loop = false;
    else if (value === "--help" || value === "-h") options.help = true;
  }
  return options;
}

function main() {
  const options = parse(process.argv.slice(2));
  if (options.help) {
    console.log("Usage: node compile.js --manifest motion-manifest.json [--out-dir dist] [--mode prototype|semantic]");
    return;
  }

  const manifest = path.resolve(options.manifest || process.env.MOTION_MANIFEST || "motion-manifest.json");
  if (!fs.existsSync(manifest)) throw new Error(`Không tìm thấy ${manifest}. Hãy export manifest bằng Figma plugin.`);
  const output = path.resolve(options.outDir || process.env.OUT_DIR || "dist");
  const result = compileFile(manifest, options);
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, "animation.svg"), result.svg);
  fs.writeFileSync(path.join(output, "animation.html"), result.html);
  fs.writeFileSync(path.join(output, "prototype-ir.json"), JSON.stringify(result.prototype, null, 2));
  fs.writeFileSync(path.join(output, "calibration-report.json"), JSON.stringify({ report: result.report, schedule: result.schedule }, null, 2));

  console.log(`Created ${path.join(output, "animation.svg")}`);
  console.log(`Created ${path.join(output, "animation.html")}`);
  console.log(`Created ${path.join(output, "prototype-ir.json")}`);
  console.log(`Prototype: ${result.report.prototypeReactions} reactions; render mode: ${result.report.renderMode}`);
}

try {
  main();
} catch (error) {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
}
