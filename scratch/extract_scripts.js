const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgText = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svgText, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

const scripts = doc.querySelectorAll('script');
console.log(`Found ${scripts.length} script tags:`);
scripts.forEach((script, idx) => {
  console.log(`--- Script ${idx} ---`);
  console.log(script.textContent);
});
