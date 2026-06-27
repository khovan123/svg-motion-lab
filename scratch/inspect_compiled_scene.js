const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgText = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svgText);
const doc = dom.window.document;
const scene = doc.querySelector('#motion-scene');

if (!scene) {
  console.log('No #motion-scene element found!');
  process.exit(1);
}

console.log('Total children in scene:', scene.children.length);
for (let i = 0; i < scene.children.length; i++) {
  const child = scene.children[i];
  console.log(`Child ${i}: tag=${child.tagName}, id=${child.id}, data-motion-id=${child.getAttribute('data-motion-id')}, class=${child.getAttribute('class')}, visibility=${child.getAttribute('visibility')}, opacity=${child.getAttribute('opacity')}`);
}
