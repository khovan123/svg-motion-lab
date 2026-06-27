const fs = require('fs');
const { JSDOM } = require('jsdom');

const htmlText = fs.readFileSync('dist/animation.html', 'utf8');
const dom = new JSDOM(htmlText);
const doc = dom.window.document;

const scripts = doc.querySelectorAll('script');
if (scripts[3]) {
  console.log("Script 3 content:");
  console.log(scripts[3].textContent);
}
