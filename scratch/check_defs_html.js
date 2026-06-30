const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state0 = manifest.states[0];
const dom = new JSDOM(state0.svg);
const doc = dom.window.document;

const defs = doc.querySelector('defs');
console.log('Defs inner HTML:');
console.log(defs ? defs.innerHTML.slice(0, 1000) : 'NO DEFS');
