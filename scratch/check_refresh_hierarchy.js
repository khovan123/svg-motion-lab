const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgText = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svgText, { contentType: 'image/svg+xml' });
const doc = dom.window.document;

const targetId = '1:4181:@root/container[0]/hugeiconsrefresh-03-stroke-rounded-1[0]';
const el = doc.querySelector(`[data-motion-id="${targetId}"]`);
if (!el) {
  console.log("Not found!");
} else {
  console.log(el.outerHTML);
}
