const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgText = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svgText, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

const scripts = doc.querySelectorAll('script');
const code = scripts[0].textContent;
console.log("Script 0 length:", code.length);
console.log("Script 0 start:");
console.log(code.slice(0, 500));
console.log("Script 0 end:");
console.log(code.slice(-500));
