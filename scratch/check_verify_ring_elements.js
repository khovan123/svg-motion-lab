const fs = require('fs');
const { JSDOM } = require('jsdom');

const svg = fs.readFileSync('verify-z-c1/animation.svg', 'utf8');
const dom = new JSDOM(svg);
const doc = dom.window.document;

const scene = doc.querySelector('#motion-scene');
const ring = doc.querySelector('[data-exact-ring]');

const all = [...(scene ? scene.querySelectorAll('[data-motion-id]') : [])];
const maskGroup_ = all.filter(e => (e.getAttribute('data-motion-id') || '').includes('mask-group_'));
const inRing = maskGroup_.filter(el => ring && ring.contains(el));
const notInRing = maskGroup_.filter(el => !ring || !ring.contains(el));

console.log('Not in ring:', notInRing.map(e => e.getAttribute('data-motion-id')).join('\n'));
console.log('\nIn ring:', inRing.map(e => e.getAttribute('data-motion-id')).join('\n'));
