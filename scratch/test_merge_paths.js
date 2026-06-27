const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state = manifest.states[0];

const dom = new JSDOM(state.svg);
const doc = dom.window.document;
const rootSvg = doc.documentElement;

function mergeDuplicateFillAndStrokePaths(rootSvg) {
  const paths = Array.from(rootSvg.querySelectorAll('path'));
  const removed = new Set();
  let mergeCount = 0;
  for (let i = 0; i < paths.length; i++) {
    const p1 = paths[i];
    if (removed.has(p1)) continue;
    const d1 = p1.getAttribute('d');
    if (!d1) continue;

    for (let j = i + 1; j < paths.length; j++) {
      const p2 = paths[j];
      if (removed.has(p2)) continue;
      const d2 = p2.getAttribute('d');
      if (d1 === d2) {
        if (p1.parentNode !== p2.parentNode) continue;

        const fill1 = p1.getAttribute('fill');
        const stroke1 = p1.getAttribute('stroke');
        const fill2 = p2.getAttribute('fill');
        const stroke2 = p2.getAttribute('stroke');

        const hasFill1 = fill1 && fill1 !== 'none';
        const hasStroke1 = stroke1 && stroke1 !== 'none';
        const hasFill2 = fill2 && fill2 !== 'none';
        const hasStroke2 = stroke2 && stroke2 !== 'none';

        if (hasFill1 && !hasStroke1 && !hasFill2 && hasStroke2) {
          for (const attr of p2.getAttributeNames()) {
            if (attr.startsWith('stroke')) {
              p1.setAttribute(attr, p2.getAttribute(attr));
            }
          }
          p2.remove();
          removed.add(p2);
          mergeCount++;
        }
        else if (!hasFill1 && hasStroke1 && hasFill2 && !hasStroke2) {
          for (const attr of p1.getAttributeNames()) {
            if (attr.startsWith('stroke')) {
              p2.setAttribute(attr, p1.getAttribute(attr));
            }
          }
          p1.remove();
          removed.add(p1);
          mergeCount++;
          break;
        }
      }
    }
  }
  console.log(`Merged ${mergeCount} duplicate paths.`);
}

console.log('Paths count before merge:', rootSvg.querySelectorAll('path').length);
mergeDuplicateFillAndStrokePaths(rootSvg);
console.log('Paths count after merge:', rootSvg.querySelectorAll('path').length);

// Print details of remaining paths
const remainingPaths = rootSvg.querySelectorAll('path');
remainingPaths.forEach((p, idx) => {
  console.log(`Path ${idx}: d=${p.getAttribute('d').slice(0, 40)}... fill="${p.getAttribute('fill') || ''}" stroke="${p.getAttribute('stroke') || ''}" stroke-width="${p.getAttribute('stroke-width') || ''}"`);
});
