const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

function buildStateMapping(state) {
  // Collect all paths from layers and svgNodeMap
  const allPaths = new Set();
  
  const extractPath = (id) => {
    if (!id) return null;
    const split = id.indexOf(':@root');
    if (split < 0) return null;
    return id.slice(split + 1); // e.g. "@root/bar-chart[0]..."
  };

  if (state.layers) {
    state.layers.forEach(l => {
      const p1 = extractPath(l.stableNodeId);
      if (p1) allPaths.add(p1);
      const p2 = extractPath(l.parentStableNodeId);
      if (p2) allPaths.add(p2);
    });
  }
  if (state.svgNodeMap) {
    state.svgNodeMap.forEach(n => {
      const p1 = extractPath(n.stableNodeId);
      if (p1) allPaths.add(p1);
      const p2 = extractPath(n.parentStableNodeId);
      if (p2) allPaths.add(p2);
    });
  }

  const pathList = [...allPaths];
  
  // To get appearance order, we can map each path to its first index in layers / svgNodeMap
  const orderMap = new Map();
  let orderIndex = 0;
  if (state.layers) {
    state.layers.forEach(l => {
      const p = extractPath(l.stableNodeId);
      if (p && !orderMap.has(p)) orderMap.set(p, orderIndex++);
    });
  }
  if (state.svgNodeMap) {
    state.svgNodeMap.forEach(n => {
      const p = extractPath(n.stableNodeId);
      if (p && !orderMap.has(p)) orderMap.set(p, orderIndex++);
    });
  }
  pathList.forEach(p => {
    if (!orderMap.has(p)) orderMap.set(p, orderIndex++);
  });

  pathList.sort((a, b) => {
    const depthA = a.split('/').length;
    const depthB = b.split('/').length;
    if (depthA !== depthB) return depthA - depthB;
    return orderMap.get(a) - orderMap.get(b);
  });

  const mapping = new Map();
  const counters = new Map(); // canonicalParentPath + '|' + baseName -> count

  pathList.forEach(path => {
    if (path === '@root') {
      mapping.set('@root', '@root');
      return;
    }

    const lastSlash = path.lastIndexOf('/');
    if (lastSlash < 0) {
      mapping.set(path, path);
      return;
    }

    const parentPath = path.slice(0, lastSlash);
    const segment = path.slice(lastSlash + 1);

    const canonicalParent = mapping.get(parentPath) || parentPath;

    // Parse segment name and index: e.g. "background_2[0]"
    const bracketIndex = segment.indexOf('[');
    if (bracketIndex < 0) {
      mapping.set(path, canonicalParent + '/' + segment);
      return;
    }

    const namePart = segment.slice(0, bracketIndex);
    const origIndexStr = segment.slice(bracketIndex + 1, segment.length - 1);
    const origIndex = parseInt(origIndexStr, 10);

    // Split suffix: e.g. "background_2" -> "background" and suffix "2"
    let baseName = namePart;
    let suffix = null;
    const suffixMatch = namePart.match(/^(.*)_(\d+)$/);
    if (suffixMatch) {
      baseName = suffixMatch[1];
      suffix = parseInt(suffixMatch[2], 10);
    }

    const key = canonicalParent + '|' + baseName;
    const count = counters.get(key) || 0;
    counters.set(key, count + 1);

    const canonicalSegment = `${baseName}[${count}]`;
    mapping.set(path, canonicalParent + '/' + canonicalSegment);
  });

  return mapping;
}

// Test on State 0
const state0 = manifest.states[0];
const mapping0 = buildStateMapping(state0);
console.log("State 0 mappings:");
for (const [orig, canonical] of mapping0.entries()) {
  if (orig.includes('background') || orig.includes('mask-group')) {
    console.log(`  ${orig}  ==>  ${canonical}`);
  }
}

// Test on State 2
const state2 = manifest.states[2];
const mapping2 = buildStateMapping(state2);
console.log("\nState 2 mappings:");
for (const [orig, canonical] of mapping2.entries()) {
  if (orig.includes('background') || orig.includes('mask-group')) {
    console.log(`  ${orig}  ==>  ${canonical}`);
  }
}
