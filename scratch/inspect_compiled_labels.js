const fs = require('fs');
const { JSDOM } = require('jsdom');

const svg = fs.readFileSync('dist/animation.svg', 'utf8');
const doc = new JSDOM(svg, { contentType: 'image/svg+xml' }).window.document;

console.log("=== Text elements in dist/animation.svg ===");
doc.querySelectorAll('text').forEach(el => {
  console.log(`Tag: text | content: "${el.textContent.trim()}" | data-motion-id: "${el.getAttribute('data-motion-id')}"`);
});

console.log("=== Elements with Giao, Thực, nộp, Đã or Number ===");
doc.querySelectorAll('*').forEach(el => {
  const motionId = el.getAttribute('data-motion-id') || '';
  if (motionId.includes('Giao') || motionId.includes('Thực') || motionId.includes('nộp') || motionId.includes('Đã') || motionId.includes('Number') || motionId.includes('label')) {
    console.log(`<${el.tagName} data-motion-id="${motionId}">`);
  }
});
