const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgContent = fs.readFileSync('dist/animation.svg', 'utf8');
const dom = new JSDOM(svgContent, { contentType: 'image/svg+xml' });
const { document } = dom.window;

const rotor = document.querySelector('[data-refresh-rotor]');
if (rotor) {
  console.log("Rotor attributes:");
  for (const attr of rotor.attributes) {
    console.log(`- ${attr.name}: "${attr.value}"`);
  }
  
  console.log("Rotor innerHTML:");
  console.log(rotor.innerHTML);
} else {
  console.log("Rotor not found!");
}
