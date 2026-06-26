const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgContent = fs.readFileSync('dist/animation.svg', 'utf8');
const doc = new JSDOM(svgContent, { contentType: 'image/svg+xml' }).window.document;

const scripts = doc.querySelectorAll('script');
console.log("Scripts count:", scripts.length);
scripts.forEach((s, i) => {
  console.log(`\n--- Script ${i} ---`);
  console.log(s.textContent.slice(0, 1000));
  if (s.textContent.length > 1000) {
    console.log("... (truncated)");
  }
});
