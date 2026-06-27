const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const doc = new (require('jsdom').JSDOM)(manifest.states[0].svg).window.document;
const all = doc.querySelectorAll('*');
all.forEach(el => {
  if (el.hasAttribute('data-motion-id')) {
    console.log(`<${el.tagName} data-motion-id="${el.getAttribute('data-motion-id')}" x="${el.getAttribute('x')}" y="${el.getAttribute('y')}" width="${el.getAttribute('width')}" height="${el.getAttribute('height')}" d="${el.getAttribute('d') ? el.getAttribute('d').slice(0, 40) + '...' : ''}">`);
  }
});
