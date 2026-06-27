const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('dist/animation.html', 'utf8');
console.log("Loading compiled HTML in JSDOM...");

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  resources: "usable",
  beforeParse(window) {
    window.requestAnimationFrame = (callback) => {
      setTimeout(() => {
        try {
          callback(performance.now());
        } catch (e) {}
      }, 10);
    };
  }
});

const doc = dom.window.document;
console.log("All element IDs:");
doc.querySelectorAll('*').forEach(el => {
  if (el.id) {
    console.log(`- Tag: ${el.tagName.toLowerCase()}, ID: ${el.id}`);
  }
});

console.log("All script tags:");
doc.querySelectorAll('script').forEach((s, idx) => {
  console.log(`- Script [${idx}]: content length = ${s.textContent.length}`);
});
