const fs = require('fs');

let code = fs.readFileSync('web/semantic-15.js', 'utf8');
code = code.replace(/\r\n/g, '\n');

const target = `    } else {
      let bestMatch = null;
      let minDiff = Infinity;
      svgElements.forEach(el => {
        if (matchedElementsSet.has(el)) return;
        const tag = el.tagName.toLowerCase();
        if (tag !== 'g' && tag !== 'path' && tag !== 'rect') return;

        const bSVG = getAbsoluteBounds(el);
        if (!bSVG) return;

        const bLayer = layer.bounds;
        const dx = Math.abs(bSVG.x - bLayer.x);
        const dy = Math.abs(bSVG.y - bLayer.y);
        const dw = Math.abs(bSVG.width - bLayer.width);
        const dh = Math.abs(bSVG.height - bLayer.height);

        const diff = dx + dy + dw + dh;
        if (dx < 4.5 && dy < 4.5 && dw < 4.5 && dh < 4.5) {
          if (diff < minDiff) {
            minDiff = diff;
            bestMatch = el;
          }
        }
      });

      if (bestMatch) {
        matchedNodes.set(layer.stableNodeId, bestMatch);
        matchedElementsSet.add(bestMatch);
        bestMatch.setAttribute('data-motion-id', layer.stableNodeId);
      }
    }
  });`;

if (code.includes(target)) {
  console.log('Target found!');
} else {
  console.log('Target NOT found!');
}
