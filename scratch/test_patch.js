const fs = require('fs');
const path = require('path');

let code = fs.readFileSync('web/semantic-15.js', 'utf8');

// Normalize all line endings to LF
code = code.replace(/\r\n/g, '\n');

// 1. Add reaction deduplication/rewriting in canonicalizeManifest
const insertTarget = 'function canonicalizeManifest(manifest){\n  const seenIds = new Set();\n  const uniqueStates = [];\n  for (const s of (manifest.states || [])) {\n    if (!seenIds.has(s.id)) {\n      seenIds.add(s.id);\n      uniqueStates.push(s);\n    }\n  }\n  manifest.states = uniqueStates;';
const insertion = `\n\n  if (manifest.prototype && Array.isArray(manifest.prototype.reactions)) {
    const byId = new Map(manifest.states.map(s => [s.id, s]));
    const reactions = manifest.prototype.reactions;
    const start = manifest.prototype.startStateId || manifest.startNodeId || (manifest.states[0] && manifest.states[0].id);
    const newReactions = [];
    const seen = new Set();
    let current = start;
    let index = 0;
    while (current && byId.has(current) && !seen.has(current)) {
      seen.add(current);
      const reaction = reactions.find(r => r.sourceStateId === current && r.trigger && r.trigger.type === 'AFTER_TIMEOUT' && S.actionOf(r));
      if (!reaction) break;
      const action = S.actionOf(reaction);
      const next = action.destinationStateId || action.destinationId;
      if (!byId.has(next)) break;
      const clonedReaction = JSON.parse(JSON.stringify(reaction));
      clonedReaction.id = current + ':' + index;
      newReactions.push(clonedReaction);
      current = next;
      index++;
    }
    manifest.prototype.reactions = newReactions;
  }`;

code = code.replace(insertTarget, insertTarget + insertion);

// 2. Update buildTrack presence logic
code = code.replace(
  `function buildTrack(id,nodes,layers,states){
  const present = layers.map((layer, idx) => {
    if (layer === null) return false;
    if (!isLayerGloballyVisible(layer, states[idx].state)) return false;
    if (nodes[idx] !== null) return true;
    if (layer.bounds != null) return true;
    return false;
  });`,
  `function buildTrack(id,nodes,layers,states){
  const present = layers.map((layer, idx) => {
    if (layer === null) return false;
    if (!isLayerGloballyVisible(layer, states[idx].state)) return false;
    if (nodes[idx] !== null) return true;
    if (layer.bounds != null) {
      if (layer.name && layer.name.toLowerCase().includes('active') && (layer.bounds.height <= 1.01 || layer.bounds.width <= 1.01)) {
        return false;
      }
      return true;
    }
    return false;
  });`
);

// 3. Save original IDs and elements set at start of matchGeometryGloballyV2
code = code.replace(
  `function matchGeometryGloballyV2(state) {
  const doc = new DOMParser().parseFromString(state.svg, 'image/svg+xml');
  const rootSvg = doc.documentElement;`,
  `function matchGeometryGloballyV2(state) {
  const doc = new DOMParser().parseFromString(state.svg, 'image/svg+xml');
  const rootSvg = doc.documentElement;
  const originalIds = new Map();
  const elementsWithOriginalIds = new Set();
  rootSvg.querySelectorAll('[data-motion-id]').forEach(el => {
    originalIds.set(el.getAttribute('data-motion-id'), el);
    elementsWithOriginalIds.add(el);
  });`
);

// 4. Do not add immediate <g> children to matchedElementsSet if they originally had data-motion-id
code = code.replace(
  `  if (scene.tagName.toLowerCase() === 'svg') {
    Array.from(scene.children).forEach(child => {
      if (child.tagName.toLowerCase() === 'g') {
        matchedElementsSet.add(child);
      }
    });
  }`,
  `  if (scene.tagName.toLowerCase() === 'svg') {
    Array.from(scene.children).forEach(child => {
      if (child.tagName.toLowerCase() === 'g' && !elementsWithOriginalIds.has(child)) {
        matchedElementsSet.add(child);
      }
    });
  }`
);

// 5. Add leaf fallback right after leaf layers Pass 2 matching
code = code.replace(
  `    if (bestMatch) {
      matchedNodes.set(layer.stableNodeId, bestMatch);
      matchedElementsSet.add(bestMatch);
      bestMatch.setAttribute('data-motion-id', layer.stableNodeId);
    }
  });

  const sortedContainers = [...containerLayers].sort((a, b) => {`,
  `    if (bestMatch) {
      matchedNodes.set(layer.stableNodeId, bestMatch);
      matchedElementsSet.add(bestMatch);
      bestMatch.setAttribute('data-motion-id', layer.stableNodeId);
    }
  });

  // Pass 3: Fallback for leaf layers using originalIds
  leafLayers.forEach(layer => {
    if (matchedNodes.has(layer.stableNodeId)) return;
    const originalEl = originalIds.get(layer.stableNodeId);
    if (originalEl && !matchedElementsSet.has(originalEl)) {
      matchedNodes.set(layer.stableNodeId, originalEl);
      matchedElementsSet.add(originalEl);
      originalEl.setAttribute('data-motion-id', layer.stableNodeId);
    }
  });

  const sortedContainers = [...containerLayers].sort((a, b) => {`
);

// 6. Add container fallback in sortedContainers loop
code = code.replace(
  `    } else {
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
  });`,
  `    } else {
      // First try originalIds fallback
      const originalEl = originalIds.get(layer.stableNodeId);
      if (originalEl && !matchedElementsSet.has(originalEl)) {
        matchedNodes.set(layer.stableNodeId, originalEl);
        matchedElementsSet.add(originalEl);
        originalEl.setAttribute('data-motion-id', layer.stableNodeId);
      } else {
        // Fall back to original bounds matching
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
    }
  });`
);

// 7. Update rotating group detection to include hugeiconsrefresh (which has rotating repair applied by semantic-13.js later)
code = code.replace(
  `  // Identify rotating groups
  const rotatingGroupIds = new Set();
  tracks.forEach(t => {
    if (t.tag === 'g' && t.rotations) {
      const hasRotation = t.rotations.some(r => r && r.angle !== 0);
      if (hasRotation) {
        rotatingGroupIds.add(t.id);
      }
    }
  });`,
  `  // Identify rotating groups
  const rotatingGroupIds = new Set();
  tracks.forEach(t => {
    if (t.tag === 'g') {
      const hasRotation = t.rotations && t.rotations.some(r => r && r.angle !== 0);
      const isRefreshRotor = t.id.includes('hugeiconsrefresh');
      if (hasRotation || isRefreshRotor) {
        rotatingGroupIds.add(t.id);
      }
    }
  });`
);

// Remove the container grouping logic completely since we match it directly using fallback!
code = code.replace(
  `  // Group container background paths at x=145, y=149 into a single <g>
  const containerEls = [];
  rootSvg.querySelectorAll('path').forEach(el => {
    let parent = el.parentNode;
    let isInsideDefs = false;
    while (parent) {
      if (parent.tagName && parent.tagName.toLowerCase() === 'defs') {
        isInsideDefs = true;
        break;
      }
      parent = parent.parentNode;
    }
    if (isInsideDefs) return;

    const b = getAbsoluteBounds(el);
    if (b && Math.abs(b.x - 145) < 5 && Math.abs(b.y - 149) < 5 && Math.abs(b.width - 64) < 5 && Math.abs(b.height - 64) < 5) {
      containerEls.push(el);
    }
  });

  if (containerEls.length > 0) {
    const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    const first = containerEls[0];
    first.parentNode.insertBefore(g, first);
    containerEls.forEach(el => g.appendChild(el));
  }`,
  `  // Container grouping logic removed because containers are matched robustly via fallback`
);

fs.writeFileSync('scratch/semantic-15.js', code, 'utf8');
console.log('Patched semantic-15.js written to scratch/semantic-15.js');
