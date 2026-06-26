const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state = manifest.states[0];

const dom = new JSDOM(state.svg);
const doc = dom.window.document;
const paths = doc.querySelectorAll('path');

console.log('Path 0 d:', paths[0].getAttribute('d'));
console.log('Path 1 d:', paths[1].getAttribute('d'));
console.log('Path 2 d:', paths[2].getAttribute('d'));
console.log('Path 3 d:', paths[3].getAttribute('d'));
console.log('Path 4 d:', paths[4].getAttribute('d'));
console.log('Path 5 d:', paths[5].getAttribute('d'));
