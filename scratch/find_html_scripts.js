const fs = require('fs');
const { JSDOM } = require('jsdom');

const htmlContent = fs.readFileSync('dist/animation.html', 'utf8');
const dom = new JSDOM(htmlContent, { contentType: 'text/html' });
const doc = dom.window.document;

const scripts = doc.querySelectorAll('script');
console.log("Total script tags in HTML:", scripts.length);
scripts.forEach((s, idx) => {
  console.log(`Script ${idx}: parent=<${s.parentElement.tagName}>, type="${s.getAttribute('type') || ''}", code length=${s.textContent.length}`);
  console.log(`  Code snippet: ${s.textContent.slice(0, 150)}...`);
});
