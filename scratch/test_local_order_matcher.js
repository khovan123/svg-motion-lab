const fs = require('fs');
const { JSDOM } = require('jsdom');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
const { window } = dom;
global.DOMParser = window.DOMParser;
global.XMLSerializer = window.XMLSerializer;

function matchLocalOrder(state) {
  const doc = new DOMParser().parseFromString(state.svg, 'image/svg+xml');
  const rootSvg = doc.documentElement;

  // 1. Find all elements that have a data-motion-id in the original SVG.
  // We treat these as our correctly-matched container groups.
  // Let's collect their original IDs and elements.
  const containerIdToEl = new Map();
  const allEl = rootSvg.querySelectorAll('*');
  allEl.forEach(el => {
    const id = el.getAttribute('data-motion-id');
    if (id) {
      containerIdToEl.set(id, el);
    }
  });

  // 2. Identify shape elements and clean their data-motion-id first:
  const shapeElements = [];
  const collectShapes = (node) => {
    const tag = node.tagName.toLowerCase();
    if (['rect', 'circle', 'ellipse', 'path', 'text'].includes(tag)) {
      shapeElements.push(node);
      node.removeAttribute('data-motion-id');
    }
    Array.from(node.children).forEach(collectShapes);
  };
  collectShapes(rootSvg);

  // 3. For each group with data-motion-id:
  for (const [groupId, groupEl] of containerIdToEl.entries()) {
    // Get all leaf layers in the Figma tree that are direct or indirect children of this group,
    // but NOT children of any nested subgroup that has its own entry in containerIdToEl!
    
    // Helper to check if a layer's nearest annotated ancestor is groupId
    const getNearestAnnotatedAncestor = (layerId) => {
      let current = state.layers.find(l => l.stableNodeId === layerId);
      while (current) {
        const parentId = current.parentStableNodeId;
        if (parentId === groupId) return true;
        if (parentId && containerIdToEl.has(parentId)) return false; // belongs to a different subgroup
        current = state.layers.find(l => l.stableNodeId === parentId);
      }
      return false;
    };

    const localLayers = state.layers.filter(l => {
      // Must not be a group/frame itself
      if (['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET'].includes(l.type)) return false;
      return getNearestAnnotatedAncestor(l.stableNodeId);
    });

    if (localLayers.length === 0) continue;

    // Sort local layers by Figma tree order (stableNodeId hierarchy order)
    const sortedLayers = localLayers.sort((a, b) => {
      const idxA = state.layers.findIndex(l => l.stableNodeId === a.stableNodeId);
      const idxB = state.layers.findIndex(l => l.stableNodeId === b.stableNodeId);
      return idxA - idxB;
    });

    // Find all shape elements inside groupEl in the DOM
    // but excluding those that are inside any nested subgroup with data-motion-id!
    const localShapes = [];
    const collectLocalShapes = (node) => {
      if (node !== groupEl && node.getAttribute('data-motion-id')) {
        // Stop going deeper into this subgroup
        return;
      }
      const tag = node.tagName.toLowerCase();
      if (['rect', 'circle', 'ellipse', 'path', 'text'].includes(tag)) {
        localShapes.push(node);
      }
      Array.from(node.children).forEach(collectLocalShapes);
    };
    collectLocalShapes(groupEl);

    console.log(`\nGroup "${groupId}": has ${sortedLayers.length} Figma layers and ${localShapes.length} SVG shapes`);

    // Match them in order!
    const count = Math.min(sortedLayers.length, localShapes.length);
    for (let i = 0; i < count; i++) {
      const layer = sortedLayers[i];
      const shape = localShapes[i];
      shape.setAttribute('data-motion-id', layer.stableNodeId);
      console.log(`  Matched shape <${shape.tagName}> to layer "${layer.name}" (${layer.stableNodeId})`);
    }

    if (sortedLayers.length > localShapes.length) {
      console.log(`  [Warning] ${sortedLayers.length - localShapes.length} layers could not be matched:`);
      for (let i = localShapes.length; i < sortedLayers.length; i++) {
        console.log(`    - ${sortedLayers[i].name} (${sortedLayers[i].stableNodeId})`);
      }
    }
  }

  return new XMLSerializer().serializeToString(rootSvg);
}

console.log("Running Local Order Matcher on State 2...");
matchLocalOrder(manifest.states[2]);
