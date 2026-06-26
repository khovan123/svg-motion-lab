const fs = require('fs');
const { JSDOM } = require('jsdom');

const htmlText = fs.readFileSync('dist/animation.html', 'utf8');
const dom = new JSDOM(htmlText, { runScripts: "dangerously" });
const doc = dom.window.document;

console.log("Checking scripts inside animation.html:");
const scripts = doc.querySelectorAll('script');
console.log(`Found ${scripts.length} script tags in HTML.`);
scripts.forEach((s, idx) => {
  console.log(`Script ${idx} tag parent: <${s.parentElement.tagName}>, length: ${s.textContent.length}`);
});
