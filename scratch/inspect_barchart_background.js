const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

manifest.states.forEach((state, sIdx) => {
  console.log(`\nState ${sIdx} (${state.name}, ID=${state.id}):`);
  
  // Find Background_6 layer
  const bg6 = state.layers.find(l => l.name.includes('Background_6') || l.stableNodeId.includes('background_6'));
  if (bg6) {
    console.log(`  Layer name: ${bg6.name}`);
    console.log(`    stableNodeId: ${bg6.stableNodeId}`);
    console.log(`    bounds: ${JSON.stringify(bg6.bounds)}`);
  } else {
    console.log(`  Background_6 layer not found in layers!`);
  }

  // Parse SVG and find element matching bg6's stableNodeId
  const dom = new JSDOM(state.svg, { contentType: 'image/svg+xml' });
  const doc = dom.window.document;
  
  // Find element with data-motion-id containing background_6 or match it using matchGeometryGloballyV2
  // Let's search all elements in the SVG for data-motion-id matching background_6 or having similar bounds
  let matchedEl = null;
  doc.querySelectorAll('*').forEach(el => {
    const id = el.getAttribute('data-motion-id') || '';
    if (id.includes('background_6')) {
      matchedEl = el;
    }
  });

  if (matchedEl) {
    console.log(`  Matched SVG element: tag=${matchedEl.tagName.toLowerCase()}, data-motion-id=${matchedEl.getAttribute('data-motion-id')}`);
    // Print attributes
    let attrs = {};
    for (const attr of matchedEl.getAttributeNames()) {
      attrs[attr] = matchedEl.getAttribute(attr);
    }
    console.log(`    attributes: ${JSON.stringify(attrs)}`);
  } else {
    console.log(`  No matched SVG element found in SVG string!`);
    // Let's find any elements with bounds close to background_6 bounds
    if (bg6) {
      const bLayer = bg6.bounds;
      console.log(`    Searching for elements with bounds close to ${JSON.stringify(bLayer)}:`);
      doc.querySelectorAll('*').forEach(el => {
        const tag = el.tagName.toLowerCase();
        if (['rect', 'path', 'circle'].includes(tag)) {
          // get bounds
          let local = null;
          if (tag === 'rect') {
            local = {
              x: Number(el.getAttribute('x') || 0),
              y: Number(el.getAttribute('y') || 0),
              width: Number(el.getAttribute('width') || 0),
              height: Number(el.getAttribute('height') || 0)
            };
          } else if (tag === 'path') {
            const tokens = el.getAttribute('d')?.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            let i = 0;
            while (i < tokens.length) {
              if (/^[a-zA-Z]$/.test(tokens[i])) { i++; }
              else {
                const x = Number(tokens[i++]);
                const y = Number(tokens[i++]);
                if (!isNaN(x) && !isNaN(y)) {
                  if (x < minX) minX = x;
                  if (x > maxX) maxX = x;
                  if (y < minY) minY = y;
                  if (y > maxY) maxY = y;
                }
              }
            }
            if (minX !== Infinity) local = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
          }
          if (local) {
            const dx = Math.abs(local.x - bLayer.x);
            const dy = Math.abs(local.y - bLayer.y);
            const dw = Math.abs(local.width - bLayer.width);
            const dh = Math.abs(local.height - bLayer.height);
            if (dx < 10 && dy < 10 && dw < 10 && dh < 10) {
              console.log(`      Found close element: tag=${tag}, bounds=${JSON.stringify(local)}, d=${el.getAttribute('d')?.slice(0,50)}`);
            }
          }
        }
      });
    }
  }
});
