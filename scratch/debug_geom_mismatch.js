const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
const { window } = dom;
global.DOMParser = window.DOMParser;

// Include the bounds helper functions from test_geom_matcher.js
const { getAbsoluteBounds } = require('./test_geom_matcher_helpers.js'); // Wait, we didn't write it to a helpers file. Let's inline them.
