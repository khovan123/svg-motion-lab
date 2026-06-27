const fs = require('fs');
const { compileManifest } = require('../src/figma-motion-compiler');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const result = compileManifest(manifest, { renderMode: 'multi-track-smart-animate' });

const normalized = result.normalizedManifest || result.report.normalizedManifest;
if (normalized) {
  console.log("Found normalizedManifest!");
  normalized.states.slice(0, 3).forEach((state, idx) => {
    console.log(`\n--- State ${idx} (${state.name}) ---`);
    const svgStr = state.svg || '';
    const matches = svgStr.match(/<mask[^>]+>/g) || [];
    console.log("Masks defined in state SVG:", matches);
    const references = svgStr.match(/mask="url\([^)]+\)"/g) || [];
    console.log("Mask references in state SVG:", references);
  });
} else {
  console.log("No normalizedManifest returned!");
}
