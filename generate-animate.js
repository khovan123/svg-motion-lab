#!/usr/bin/env node
/* UMD entry: browser keeps the existing SVG uploader; Node compiles Figma manifests. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(true);
  else root.GenerateAnimate = factory(false);
})(typeof self !== "undefined" ? self : this, function (isNode) {
  "use strict";

  var DEFAULT_FRAME_DURATION = 0.1;
  var DEFAULT_WIDTH = 355;
  var DEFAULT_HEIGHT = 240;

  function extractSvgContent(svg) {
    var match = String(svg || "").match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i);
    if (!match) throw new Error("File không chứa thẻ SVG hợp lệ.");
    return match[1].trim();
  }

  function extractSvgAttributes(svg) {
    var openTag = String(svg || "").match(/<svg\b([^>]*)>/i);
    var attrs = openTag ? openTag[1] : "";
    var width = readNumberAttribute(attrs, "width");
    var height = readNumberAttribute(attrs, "height");
    var viewBox = readStringAttribute(attrs, "viewBox");
    if ((!width || !height) && viewBox) {
      var parts = viewBox.trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts.every(Number.isFinite)) {
        width = width || parts[2];
        height = height || parts[3];
      }
    }
    return { width: width, height: height, viewBox: viewBox };
  }

  function readNumberAttribute(attrs, name) {
    var value = readStringAttribute(attrs, name);
    var match = value && value.match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  }

  function readStringAttribute(attrs, name) {
    var pattern = new RegExp("\\b" + name + "\\s*=\\s*([\"'])(.*?)\\1", "i");
    var match = attrs.match(pattern);
    return match ? match[2] : "";
  }

  function escapeXml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/\"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function normalizeFrame(frame, index) {
    if (typeof frame === "string") return { name: "frame-" + (index + 1) + ".svg", svg: frame };
    return { name: frame.name || "frame-" + (index + 1) + ".svg", svg: frame.svg || frame.content || "" };
  }

  /* Legacy browser fallback. Plugin manifest mode is the calibrated path. */
  function generateAnimatedSvg(inputFrames, options) {
    var opts = options || {};
    var frames = (inputFrames || []).map(normalizeFrame);
    if (!frames.length) throw new Error("Cần ít nhất 1 file SVG để tạo animation.");
    var first = extractSvgAttributes(frames[0].svg);
    var width = Number(opts.width) || first.width || DEFAULT_WIDTH;
    var height = Number(opts.height) || first.height || DEFAULT_HEIGHT;
    var viewBox = opts.viewBox || first.viewBox || "0 0 " + width + " " + height;
    var frameDuration = Number(opts.frameDuration) || DEFAULT_FRAME_DURATION;
    var totalMs = Math.round(frames.length * frameDuration * 1000);
    var styles = ["<style>", ".frame{visibility:hidden;animation-duration:" + totalMs + "ms;animation-iteration-count:infinite;animation-timing-function:steps(1,end)}"];
    frames.forEach(function (_frame, index) {
      var start = index / frames.length * 100;
      var end = (index + 1) / frames.length * 100;
      styles.push(".frame-" + (index + 1) + "{animation-name:f" + (index + 1) + "}");
      styles.push("@keyframes f" + (index + 1) + "{0%," + Math.max(0, start - 0.0001) + "%{visibility:hidden}" + start + "%," + Math.max(start, end - 0.0001) + "%{visibility:visible}" + end + "%,100%{visibility:hidden}}");
    });
    styles.push("</style>");
    var groups = frames.map(function (frame, index) {
      return '<g class="frame frame-' + (index + 1) + '">' + extractSvgContent(frame.svg) + "</g>";
    }).join("\n");
    return '<svg width="' + escapeXml(width) + '" height="' + escapeXml(height) + '" viewBox="' + escapeXml(viewBox) + '" xmlns="http://www.w3.org/2000/svg">' + styles.join("\n") + groups + "</svg>";
  }

  var api = {
    DEFAULT_FRAME_DURATION: DEFAULT_FRAME_DURATION,
    DEFAULT_WIDTH: DEFAULT_WIDTH,
    DEFAULT_HEIGHT: DEFAULT_HEIGHT,
    extractSvgContent: extractSvgContent,
    extractSvgAttributes: extractSvgAttributes,
    generateAnimatedSvg: generateAnimatedSvg
  };

  if (isNode) {
    api.build = function build(options) {
      var fs = require("fs");
      var path = require("path");
      var compiler = require("./src/figma-motion-compiler");
      var opts = options || {};
      var root = __dirname;
      var manifestPath = path.resolve(root, opts.manifest || process.env.MOTION_MANIFEST || "motion-manifest.json");
      if (!fs.existsSync(manifestPath)) throw new Error("Không tìm thấy " + manifestPath + ". Hãy export motion-manifest.json bằng Figma plugin.");
      var result = compiler.compileFile(manifestPath, opts);
      var outDir = path.resolve(root, opts.outDir || process.env.OUT_DIR || "dist");
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, "animation.svg"), result.svg);
      fs.writeFileSync(path.join(outDir, "animation.html"), result.html);
      fs.writeFileSync(path.join(outDir, "calibration-report.json"), JSON.stringify({ report: result.report, schedule: result.schedule }, null, 2));
      result.outDir = outDir;
      return result;
    };
  }

  return api;
});

if (typeof module === "object" && module.exports && require.main === module) {
  var argv = process.argv.slice(2);
  var options = {};
  for (var i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--manifest") options.manifest = argv[++i];
    else if (argv[i] === "--out-dir") options.outDir = argv[++i];
    else if (argv[i] === "--hold") options.defaultHold = Number(argv[++i]);
    else if (argv[i] === "--duration") options.defaultDuration = Number(argv[++i]);
    else if (argv[i] === "--spring-samples") options.springSamples = Number(argv[++i]);
    else if (argv[i] === "--no-loop") options.loop = false;
    else if (argv[i] === "--help" || argv[i] === "-h") options.help = true;
  }
  if (options.help) {
    console.log("Usage: node generate-animate.js --manifest motion-manifest.json [--out-dir dist] [--hold 0.7] [--duration 0.4] [--spring-samples 36] [--no-loop]");
  } else {
    var result = module.exports.build(options);
    var path = require("path");
    console.log("Created " + path.join(result.outDir, "animation.svg"));
    console.log("Created " + path.join(result.outDir, "animation.html"));
    console.log("Calibration: " + result.report.matchedLayers + " matched, " + result.report.gradientTracks + " gradients, " + result.report.pathMorphs + " path morphs, " + result.report.fallbackLayers + " fallbacks.");
  }
}
