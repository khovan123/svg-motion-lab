const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgContent = fs.readFileSync('dist/animation.svg', 'utf8');
const doc = new JSDOM(svgContent, { contentType: 'image/svg+xml' }).window.document;

const scripts = doc.querySelectorAll('script');
const script1 = scripts[1].textContent;
const idx = script1.indexOf("child.setAttribute('opacity'");
if (idx !== -1) {
  console.log("Found opacity assignment in Script 1:");
  console.log(script1.substring(idx - 100, idx + 300));
} else {
  console.log("opacity assignment NOT found in Script 1!");
}
