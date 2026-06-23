/* eslint-disable no-var */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.GenerateAnimate = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var DEFAULT_FRAME_DURATION = 0.1;
  var DEFAULT_WIDTH = 355;
  var DEFAULT_HEIGHT = 240;

  function extractSvgContent(svg) {
    var match = String(svg || "").match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i);

    if (!match) {
      throw new Error("File không chứa thẻ SVG hợp lệ.");
    }

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
      if (parts.length === 4 && parts.every(function (part) { return Number.isFinite(part); })) {
        width = width || parts[2];
        height = height || parts[3];
      }
    }

    return {
      width: width,
      height: height,
      viewBox: viewBox
    };
  }

  function readNumberAttribute(attrs, name) {
    var value = readStringAttribute(attrs, name);
    if (!value) return null;

    var match = value.match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  }

  function readStringAttribute(attrs, name) {
    var pattern = new RegExp("\\b" + name + "\\s*=\\s*([\"'])(.*?)\\1", "i");
    var match = attrs.match(pattern);
    return match ? match[2] : "";
  }

  function escapeXml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function normalizeFrame(frame, index) {
    if (typeof frame === "string") {
      return {
        name: "frame-" + (index + 1) + ".svg",
        svg: frame
      };
    }

    return {
      name: frame.name || "frame-" + (index + 1) + ".svg",
      svg: frame.svg || frame.content || ""
    };
  }

  function generateAnimatedSvg(inputFrames, options) {
    var opts = options || {};
    var frames = (inputFrames || []).map(normalizeFrame);

    if (!frames.length) {
      throw new Error("Cần ít nhất 1 file SVG để tạo animation.");
    }

    var firstAttrs = extractSvgAttributes(frames[0].svg);
    var width = Number(opts.width) || firstAttrs.width || DEFAULT_WIDTH;
    var height = Number(opts.height) || firstAttrs.height || DEFAULT_HEIGHT;
    var viewBox = opts.viewBox || firstAttrs.viewBox || "0 0 " + width + " " + height;
    var frameDuration = Number(opts.frameDuration) || DEFAULT_FRAME_DURATION;
    var totalDuration = frames.length * frameDuration;
    var totalDurationMs = Math.round(totalDuration * 1000);
    var styleMarkup = createSequentialStyle(frames.length, totalDurationMs);

    var frameMarkup = frames
      .map(function (frame, index) {
        var content = extractSvgContent(frame.svg);

        return [
          '  <g id="animation-frame-' + (index + 1) + '" class="frame frame-' + (index + 1) + '" fill="none">',
          indent(content, 4),
          "  </g>"
        ].join("\n");
      })
      .join("\n");

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<svg width="' + escapeXml(width) + '" height="' + escapeXml(height) + '" viewBox="' + escapeXml(viewBox) + '" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + escapeXml(createAriaLabel(frames.length)) + '">',
      styleMarkup,
      frameMarkup,
      "</svg>",
      ""
    ].join("\n");
  }

  function createSequentialStyle(frameCount, totalDurationMs) {
    var lines = [
      "  <style>",
      "    :root { --animation-duration: " + totalDurationMs + "ms; }",
      "    .frame { visibility: hidden; animation-duration: var(--animation-duration); animation-iteration-count: infinite; animation-timing-function: steps(1, end); }"
    ];

    for (var index = 0; index < frameCount; index += 1) {
      var frameNumber = index + 1;
      var start = percentage(index / frameCount);
      var startBefore = percentage(Math.max(0, (index / frameCount) * 100 - 0.0001), true);
      var end = percentage((index + 1) / frameCount);
      var endBefore = percentage(Math.max(0, ((index + 1) / frameCount) * 100 - 0.0001), true);

      lines.push("    .frame-" + frameNumber + " { animation-name: frame-" + frameNumber + "-cycle; }");

      if (index === 0 && frameCount === 1) {
        lines.push("    @keyframes frame-" + frameNumber + "-cycle { 0%, 100% { visibility: visible; } }");
      } else if (index === 0) {
        lines.push("    @keyframes frame-" + frameNumber + "-cycle { 0%, " + endBefore + "% { visibility: visible; } " + end + "%, 100% { visibility: hidden; } }");
      } else if (index === frameCount - 1) {
        lines.push("    @keyframes frame-" + frameNumber + "-cycle { 0%, " + startBefore + "% { visibility: hidden; } " + start + "%, 100% { visibility: visible; } }");
      } else {
        lines.push("    @keyframes frame-" + frameNumber + "-cycle { 0%, " + startBefore + "% { visibility: hidden; } " + start + "%, " + endBefore + "% { visibility: visible; } " + end + "%, 100% { visibility: hidden; } }");
      }
    }

    lines.push("  </style>");
    return lines.join("\n");
  }

  function createAriaLabel(frameCount) {
    if (frameCount === 9) {
      return "Sequential nine-frame SVG animation";
    }

    return "Sequential " + frameCount + "-frame SVG animation";
  }

  function indent(value, spaces) {
    var padding = new Array(spaces + 1).join(" ");
    return String(value)
      .split("\n")
      .map(function (line) { return line ? padding + line : line; })
      .join("\n");
  }

  function percentage(value, isAlreadyPercent) {
    var percent = isAlreadyPercent ? value : value * 100;
    if (percent <= 0) return "0";
    if (percent >= 100) return "100";
    return percent.toFixed(6);
  }

  return {
    DEFAULT_FRAME_DURATION: DEFAULT_FRAME_DURATION,
    DEFAULT_WIDTH: DEFAULT_WIDTH,
    DEFAULT_HEIGHT: DEFAULT_HEIGHT,
    extractSvgContent: extractSvgContent,
    extractSvgAttributes: extractSvgAttributes,
    generateAnimatedSvg: generateAnimatedSvg
  };
});

if (typeof module === "object" && module.exports && require.main === module) {
  var fs = require("fs");
  var path = require("path");
  var generator = module.exports;
  var frameCount = Number(process.env.FRAME_COUNT) || 9;
  var frames = [];

  for (var i = 1; i <= frameCount; i += 1) {
    var filename = "Property 1=" + i + ".svg";
    var filepath = path.join(__dirname, filename);

    if (!fs.existsSync(filepath)) {
      throw new Error("Không tìm thấy file: " + filename);
    }

    frames.push({
      name: filename,
      svg: fs.readFileSync(filepath, "utf8")
    });
  }

  var output = generator.generateAnimatedSvg(frames, {
    frameDuration: Number(process.env.FRAME_DURATION) || generator.DEFAULT_FRAME_DURATION,
    width: Number(process.env.WIDTH) || generator.DEFAULT_WIDTH,
    height: Number(process.env.HEIGHT) || generator.DEFAULT_HEIGHT
  });

  fs.writeFileSync(path.join(__dirname, "animation.svg"), output, "utf8");
  console.log("Đã tạo animation.svg");
}
