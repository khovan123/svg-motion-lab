const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgText = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svgText, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

const scripts = doc.querySelectorAll('script');
scripts.forEach((script, idx) => {
  let parent = script.parentElement;
  let siblings = Array.from(parent.children);
  let index = siblings.indexOf(script);
  console.log(`Script ${idx}: parent = <${parent.tagName}>, index = ${index}/${siblings.length}`);
});
