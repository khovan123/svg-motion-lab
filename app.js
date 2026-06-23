(function () {
  "use strict";

  var files = [];
  var generatedSvg = "";
  var previewUrl = "";

  var els = {
    fileInput: document.getElementById("fileInput"),
    dropzone: document.getElementById("dropzone"),
    fileList: document.getElementById("fileList"),
    codePreview: document.getElementById("codePreview"),
    preview: document.getElementById("preview"),
    status: document.getElementById("status"),
    frameCount: document.getElementById("frameCount"),
    totalDuration: document.getElementById("totalDuration"),
    frameDurationInput: document.getElementById("frameDurationInput"),
    widthInput: document.getElementById("widthInput"),
    heightInput: document.getElementById("heightInput"),
    generateBtn: document.getElementById("generateBtn"),
    downloadSvgBtn: document.getElementById("downloadSvgBtn"),
    downloadCodeBtn: document.getElementById("downloadCodeBtn"),
    downloadHtmlBtn: document.getElementById("downloadHtmlBtn"),
    downloadZipBtn: document.getElementById("downloadZipBtn"),
    clearBtn: document.getElementById("clearBtn")
  };

  initScene();
  bindEvents();
  updateStats();

  if (window.gsap) {
    gsap.from(".hero-copy > *", { y: 24, opacity: 0, duration: 0.8, stagger: 0.08, ease: "power3.out" });
    gsap.from(".panel", { y: 28, opacity: 0, duration: 0.8, stagger: 0.08, ease: "power3.out", delay: 0.18 });
  }

  function bindEvents() {
    els.fileInput.addEventListener("change", function (event) {
      readFiles(Array.from(event.target.files || []));
      event.target.value = "";
    });

    ["dragenter", "dragover"].forEach(function (eventName) {
      els.dropzone.addEventListener(eventName, function (event) {
        event.preventDefault();
        els.dropzone.classList.add("is-dragging");
      });
    });

    ["dragleave", "drop"].forEach(function (eventName) {
      els.dropzone.addEventListener(eventName, function (event) {
        event.preventDefault();
        els.dropzone.classList.remove("is-dragging");
      });
    });

    els.dropzone.addEventListener("drop", function (event) {
      readFiles(Array.from(event.dataTransfer.files || []));
    });

    els.generateBtn.addEventListener("click", generate);
    els.downloadSvgBtn.addEventListener("click", downloadSvg);
    els.downloadCodeBtn.addEventListener("click", downloadCode);
    els.downloadHtmlBtn.addEventListener("click", downloadHtml);
    els.downloadZipBtn.addEventListener("click", downloadZip);
    els.clearBtn.addEventListener("click", clearAll);

    [els.frameDurationInput, els.widthInput, els.heightInput].forEach(function (input) {
      input.addEventListener("input", function () {
        if (files.length) {
          updateStats();
        }
      });
    });
  }

  function readFiles(fileItems) {
    var svgFiles = fileItems.filter(function (file) {
      return file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
    });

    if (!svgFiles.length) {
      setStatus("Chỉ nhận file .svg.", true);
      return;
    }

    Promise.all(svgFiles.map(readFile))
      .then(function (items) {
        files = files.concat(items).sort(function (a, b) {
          return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
        });

        generatedSvg = "";
        els.codePreview.textContent = "Generate animation để xem code nhúng.";
        setDownloadReady(false);
        renderFileList();
        updateStats();
        setStatus("Đã tải " + files.length + " SVG. Đang tạo preview...");

        if (files.length === items.length) {
          hydrateDimensionsFromFirstSvg();
        }

        if (window.gsap) {
          gsap.from(".file-item", { y: 12, opacity: 0, duration: 0.35, stagger: 0.03, ease: "power2.out" });
        }

        generate();
      })
      .catch(function (error) {
        setStatus(error.message, true);
      });
  }

  function readFile(file) {
    return file.text().then(function (svg) {
      GenerateAnimate.extractSvgContent(svg);
      return {
        name: file.name,
        size: file.size,
        svg: svg
      };
    });
  }

  function hydrateDimensionsFromFirstSvg() {
    try {
      var attrs = GenerateAnimate.extractSvgAttributes(files[0].svg);
      if (attrs.width) els.widthInput.value = attrs.width;
      if (attrs.height) els.heightInput.value = attrs.height;
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  function generate() {
    try {
      generatedSvg = GenerateAnimate.generateAnimatedSvg(files, getOptions());
      renderPreview(generatedSvg);
      renderCodePreview();
      setDownloadReady(true);
      updateStats();
      setStatus("Đã tạo animation.svg từ " + files.length + " frame.");

      if (window.gsap) {
        gsap.fromTo(els.preview.firstElementChild, { scale: 0.96, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "power2.out" });
      }
    } catch (error) {
      setStatus(error.message, true);
      setDownloadReady(false);
    }
  }

  function renderPreview(svg) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    previewUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));

    var frame = document.createElement("iframe");
    frame.title = "Preview animated SVG";
    frame.setAttribute("sandbox", "");
    frame.src = previewUrl;

    els.preview.innerHTML = "";
    els.preview.appendChild(frame);
  }

  function getOptions() {
    return {
      frameDuration: Number(els.frameDurationInput.value) || GenerateAnimate.DEFAULT_FRAME_DURATION,
      width: Number(els.widthInput.value) || GenerateAnimate.DEFAULT_WIDTH,
      height: Number(els.heightInput.value) || GenerateAnimate.DEFAULT_HEIGHT
    };
  }

  function renderFileList() {
    els.fileList.innerHTML = "";

    files.forEach(function (file, index) {
      var item = document.createElement("li");
      item.className = "file-item";
      item.innerHTML = [
        '<span class="file-index">' + (index + 1) + "</span>",
        "<div>",
        '<div class="file-name" title="' + escapeHtml(file.name) + '">' + escapeHtml(file.name) + "</div>",
        '<div class="file-size">' + formatBytes(file.size) + "</div>",
        "</div>",
        '<button class="small-button" type="button" data-index="' + index + '">Bỏ</button>'
      ].join("");

      item.querySelector("button").addEventListener("click", function () {
        files.splice(index, 1);
        generatedSvg = "";
        setDownloadReady(false);
        els.codePreview.textContent = "Generate animation để xem code nhúng.";
        renderFileList();
        updateStats();
        if (files.length) {
          setStatus("Đã cập nhật danh sách frame. Đang tạo lại preview...");
          generate();
        } else {
          resetPreview();
          setStatus("Chưa có SVG nào được tải lên.");
        }
      });

      els.fileList.appendChild(item);
    });
  }

  function downloadSvg() {
    if (!generatedSvg) return;
    downloadBlob(new Blob([generatedSvg], { type: "image/svg+xml;charset=utf-8" }), "animation.svg");
  }

  function downloadCode() {
    if (!generatedSvg) return;
    var code = createReactComponent(generatedSvg);
    downloadBlob(new Blob([code], { type: "text/jsx;charset=utf-8" }), "AnimatedSvg.jsx");
  }

  function downloadHtml() {
    if (!generatedSvg) return;
    var html = createEmbedHtml(generatedSvg);
    downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), "animation-embed.html");
  }

  function downloadZip() {
    if (!generatedSvg || !window.JSZip) return;

    var zip = new JSZip();
    zip.file("animation.svg", generatedSvg);
    zip.file("AnimatedSvg.jsx", createReactComponent(generatedSvg));
    zip.file("animation-embed.html", createEmbedHtml(generatedSvg));
    zip.file("README.txt", createReadme());

    var sourceFolder = zip.folder("source-frames");
    files.forEach(function (file, index) {
      sourceFolder.file(pad(index + 1) + "-" + sanitizeFilename(file.name), file.svg);
    });

    zip.generateAsync({ type: "blob" }).then(function (blob) {
      downloadBlob(blob, "animated-svg-pack.zip");
    });
  }

  function clearAll() {
    files = [];
    generatedSvg = "";
    resetPreview();
    els.codePreview.textContent = "Generate animation để xem code nhúng.";
    renderFileList();
    updateStats();
    setDownloadReady(false);
    setStatus("Chưa có SVG nào được tải lên.");
  }

  function updateStats() {
    var duration = Number(els.frameDurationInput.value) || GenerateAnimate.DEFAULT_FRAME_DURATION;
    els.frameCount.textContent = files.length;
    els.totalDuration.textContent = (files.length * duration).toFixed(1) + "s";
  }

  function setDownloadReady(isReady) {
    els.downloadSvgBtn.disabled = !isReady;
    els.downloadCodeBtn.disabled = !isReady;
    els.downloadHtmlBtn.disabled = !isReady;
    els.downloadZipBtn.disabled = !isReady;
  }

  function resetPreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = "";
    }

    els.preview.innerHTML = "<span>Preview sẽ xuất hiện sau khi generate.</span>";
  }

  function createReactComponent(svg) {
    var jsx = prepareStyleTagsForJsx(svgToJsx(svg));
    var svgWithProps = injectReactSvgProps(jsx);

    return [
      "export default function AnimatedSvg({",
      '  className = "h-5 w-5",',
      "  ariaHidden = true,",
      "  ...props",
      "}) {",
      "  return (",
      indentCode(svgWithProps, 4),
      "  );",
      "}",
      ""
    ].join("\n");
  }

  function renderCodePreview() {
    var code = createReactComponent(generatedSvg);
    var lines = code.split("\n");
    var compact = lines.slice(0, 42).join("\n");
    els.codePreview.textContent = lines.length > 42 ? compact + "\n..." : compact;
  }

  function createEmbedHtml(svg) {
    var options = getOptions();

    return [
      "<!doctype html>",
      '<html lang="vi">',
      "<head>",
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1">',
      "  <title>Animated SVG Embed</title>",
      "  <style>",
      "    body {",
      "      min-height: 100vh;",
      "      margin: 0;",
      "      display: grid;",
      "      place-items: center;",
      "      background: transparent;",
      "    }",
      "",
      "    .animated-svg-embed {",
      "      display: inline-grid;",
      "      place-items: center;",
      "      max-width: 100%;",
      "    }",
      "",
      "    .animated-svg-embed svg {",
      "      display: block;",
      "      width: min(100%, " + options.width + "px);",
      "      height: auto;",
      "    }",
      "  </style>",
      "</head>",
      "<body>",
      '  <div class="animated-svg-embed" role="img" aria-label="Animated SVG">',
      indentCode(svg, 4),
      "  </div>",
      "</body>",
      "</html>",
      ""
    ].join("\n");
  }

  function svgToJsx(svg) {
    return String(svg)
      .replace(/<\?xml[^>]*>\s*/i, "")
      .replace(/<[^>]+>/g, function (tag) {
        return tag.replace(/\s([:@A-Za-z_][\w:.-]*)=(["'])(.*?)\2/g, function (_match, name, quote, value) {
          if (name === "style") {
            return " style={" + styleStringToJsxObject(value) + "}";
          }

          return " " + toJsxAttrName(name) + "=" + quote + value + quote;
        });
      });
  }

  function prepareStyleTagsForJsx(jsx) {
    return String(jsx).replace(/<style>([\s\S]*?)<\/style>/g, function (_match, css) {
      return "<style>{`" + css.replace(/`/g, "\\`").replace(/\$\{/g, "\\${") + "`}</style>";
    });
  }

  function injectReactSvgProps(jsx) {
    return jsx.replace(/<svg\b([^>]*)>/i, function (_match, attrs) {
      var cleanAttrs = attrs
        .replace(/\sclassName=(["']).*?\1/i, "")
        .replace(/\saria-hidden=(["']).*?\1/i, "")
        .trim();

      return [
        "<svg",
        "  aria-hidden={ariaHidden}",
        "  className={className}",
        cleanAttrs ? indentCode(cleanAttrs, 2) : "",
        "  {...props}",
        ">"
      ].filter(Boolean).join("\n");
    });
  }

  function toJsxAttrName(name) {
    var exact = {
      "class": "className",
      "for": "htmlFor",
      "clip-rule": "clipRule",
      "clip-path": "clipPath",
      "fill-rule": "fillRule",
      "fill-opacity": "fillOpacity",
      "font-family": "fontFamily",
      "font-size": "fontSize",
      "font-weight": "fontWeight",
      "marker-end": "markerEnd",
      "marker-mid": "markerMid",
      "marker-start": "markerStart",
      "stop-color": "stopColor",
      "stop-opacity": "stopOpacity",
      "stroke-dasharray": "strokeDasharray",
      "stroke-dashoffset": "strokeDashoffset",
      "stroke-linecap": "strokeLinecap",
      "stroke-linejoin": "strokeLinejoin",
      "stroke-miterlimit": "strokeMiterlimit",
      "stroke-opacity": "strokeOpacity",
      "stroke-width": "strokeWidth",
      "xlink:href": "xlinkHref",
      "xml:space": "xmlSpace"
    };

    if (exact[name]) return exact[name];
    if (/^(aria|data)-/.test(name)) return name;
    if (name.indexOf("-") === -1) return name;

    return name.replace(/-([a-z])/g, function (_match, letter) {
      return letter.toUpperCase();
    });
  }

  function styleStringToJsxObject(value) {
    var entries = String(value).split(";").map(function (part) {
      return part.trim();
    }).filter(Boolean).map(function (part) {
      var splitAt = part.indexOf(":");
      if (splitAt === -1) return null;
      var key = part.slice(0, splitAt).trim().replace(/-([a-z])/g, function (_match, letter) {
        return letter.toUpperCase();
      });
      var styleValue = part.slice(splitAt + 1).trim().replace(/"/g, '\\"');
      return key + ': "' + styleValue + '"';
    }).filter(Boolean);

    return "{ " + entries.join(", ") + " }";
  }

  function createReadme() {
    return [
      "Animated SVG export",
      "",
      "Files:",
      "- animation.svg: file SVG animated, dùng được với <img src=\"animation.svg\"> hoặc inline SVG.",
      "- AnimatedSvg.jsx: React/Next.js component có inline SVG, dùng className và camelCase SVG props.",
      "- animation-embed.html: file HTML độc lập có inline SVG để nhúng hoặc mở trực tiếp.",
      "- source-frames/: các SVG gốc đã upload.",
      "",
      "Cách dùng nhanh:",
      "1. Dùng <img src=\"animation.svg\" alt=\"Animated SVG\"> nếu chỉ cần hiển thị.",
      "2. Import AnimatedSvg from './AnimatedSvg' nếu muốn nhúng trực tiếp trong React/Next.js.",
      "3. Dùng animation-embed.html nếu cần code HTML thuần.",
      ""
    ].join("\n");
  }

  function setStatus(message, isError) {
    els.status.textContent = message;
    els.status.classList.toggle("is-error", Boolean(isError));
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function formatBytes(size) {
    if (!size) return "0 B";
    var units = ["B", "KB", "MB"];
    var index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
    return (size / Math.pow(1024, index)).toFixed(index ? 1 : 0) + " " + units[index];
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function indentCode(value, spaces) {
    var padding = new Array(spaces + 1).join(" ");
    return String(value)
      .split("\n")
      .map(function (line) { return line ? padding + line : line; })
      .join("\n");
  }

  function sanitizeFilename(value) {
    return String(value).replace(/[\\/:*?"<>|]+/g, "-");
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function initScene() {
    if (!window.THREE) return;

    var canvas = document.getElementById("scene");
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    var group = new THREE.Group();
    var particles = [];

    camera.position.z = 7;
    scene.add(group);

    var geometry = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    var material = new THREE.MeshStandardMaterial({
      color: 0x69e6ff,
      roughness: 0.35,
      metalness: 0.18,
      emissive: 0x07131d
    });

    for (var i = 0; i < 90; i += 1) {
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 6);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      mesh.userData.speed = 0.2 + Math.random() * 0.8;
      group.add(mesh);
      particles.push(mesh);
    }

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    var light = new THREE.PointLight(0x8dffb4, 18, 20);
    light.position.set(2.5, 3, 4);
    scene.add(light);

    resize();
    window.addEventListener("resize", resize);
    renderer.setAnimationLoop(animate);

    function resize() {
      var width = window.innerWidth;
      var height = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function animate(time) {
      var t = time * 0.001;
      group.rotation.x = Math.sin(t * 0.18) * 0.12;
      group.rotation.y = t * 0.08;

      particles.forEach(function (mesh, index) {
        mesh.rotation.x += 0.006 * mesh.userData.speed;
        mesh.rotation.y += 0.01 * mesh.userData.speed;
        mesh.position.y += Math.sin(t + index) * 0.0008;
      });

      renderer.render(scene, camera);
    }
  }
})();
