const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.resolve('node_modules/jsdom'));

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state = manifest.states[0];

const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const parser = new window.DOMParser();
const doc = parser.parseFromString(state.svg, 'image/svg+xml');

console.log("=== ALL ELEMENTS IN STATE 0 SVG ===");
const els = doc.documentElement.querySelectorAll('*');
els.forEach((el, idx) => {
  const tag = el.tagName.toLowerCase();
  if (['rect', 'circle', 'ellipse', 'path', 'g'].includes(tag)) {
    console.log(`[${idx}] <${tag}>: fill="${el.getAttribute('fill')}" stroke="${el.getAttribute('stroke')}" x="${el.getAttribute('x')}" y="${el.getAttribute('y')}" width="${el.getAttribute('width')}" height="${el.getAttribute('height')}" d="${el.getAttribute('d') ? el.getAttribute('d').slice(0, 50) + '...' : ''}" transform="${el.getAttribute('transform')}"`);
  }
});
