figma.showUI(__html__, { width: 420, height: 360, themeColors: true });

const NS = "svg-motion-lab";
const KEY = "motion-id";

figma.ui.onmessage = async message => {
  if (!message || message.type !== "export") return;
  try {
    const manifest = await exportManifest(message.options || {});
    figma.ui.postMessage({ type: "manifest", manifest });
  } catch (error) {
    figma.ui.postMessage({
      type: "error",
      message: error && error.message ? error.message : String(error)
    });
  }
};

figma.ui.postMessage({ type: "ready" });

async function exportManifest(options) {
  figma.ui.postMessage({ type: "progress", message: "Bước 1/4 · Đang đọc selection trên current page…" });

  const selected = figma.currentPage.selection.filter(isState);
  const candidates = selected.length ? selected : figma.currentPage.children.filter(isState);
  if (!candidates.length) throw new Error("Hãy chọn ít nhất một Frame, Component hoặc Instance state.");

  figma.ui.postMessage({ type: "progress", message: "Bước 2/4 · Đang xác định thứ tự state…" });
  const roots = orderStates(candidates);
  const states = [];

  for (let index = 0; index < roots.length; index += 1) {
    const root = roots[index];
    const absolute = root.absoluteBoundingBox || { x: root.x || 0, y: root.y || 0 };
    const variant = variantContext(root);
    const layers = [];

    figma.ui.postMessage({
      type: "progress",
      message: `Bước 3/4 · Đang quét layer ${index + 1}/${roots.length}: ${root.name}`
    });

    walk(root, null, "@root", 0, { x: absolute.x || 0, y: absolute.y || 0 }, layers, options, {
      variant,
      ancestors: [],
      appliedMasks: []
    });

    figma.ui.postMessage({
      type: "progress",
      message: `Bước 4/4 · Đang render SVG ${index + 1}/${roots.length}: ${root.name}`
    });

    states.push({
      id: root.id,
      stableStateId: variant.componentSetId ? `${variant.componentSetId}:${variant.variantKey}` : root.id,
      name: root.name,
      order: index,
      width: number(root.width),
      height: number(root.height),
      variant,
      layers,
      svg: options.includeStateSvg === false ? null : await exportSvg(root)
    });
  }

  const stateMap = new Map();
  roots.forEach(root => mapState(root, root.id, stateMap));
  const rootIds = new Set(roots.map(root => root.id));
  const prototype = collectPrototype(roots, stateMap, rootIds);
  prototype.startStateId = states[0].id;

  return {
    schema: "svg-motion-lab/figma-manifest@3",
    fidelityMetadataVersion: 2,
    exportedAt: new Date().toISOString(),
    source: {
      fileName: figma.root.name,
      pageId: figma.currentPage.id,
      pageName: figma.currentPage.name
    },
    capabilities: {
      stableNodeIdsAcrossVariants: true,
      maskGeometry: true,
      clipHierarchy: true,
      filterHierarchy: true,
      vectorTopologyCorrespondence: true,
      gradientTransform: true
    },
    startNodeId: states[0].id,
    stateOrder: states.map(state => state.id),
    states,
    prototype,
    transitions: legacyTransitions(prototype.reactions),
    calibration: {
      geometryPrecision: 4,
      gradientPrecision: 5,
      renderMode: "prototype",
      layerMatchOrder: ["stableNodeId", "pluginKey", "semanticPath", "structuralSlot"],
      fidelityMetadataVersion: 2
    }
  };
}

function walk(node, parentKey, path, siblingIndex, origin, output, options, context) {
  if (!options.includeHidden && node.visible === false) return;

  const pluginKey = pluginData(node);
  const key = pluginKey || path;
  const stableNodeId = `${context.variant.componentSetId || context.variant.variantRootId}:${path}`;
  const absolute = node.absoluteBoundingBox || {
    x: node.x || 0,
    y: node.y || 0,
    width: node.width || 0,
    height: node.height || 0
  };
  const bounds = {
    x: number(absolute.x - origin.x),
    y: number(absolute.y - origin.y),
    width: number(absolute.width),
    height: number(absolute.height)
  };
  const nodeEffects = effects(node);
  const clip = clipGeometry(node, stableNodeId, bounds);
  const mask = maskGeometry(node, stableNodeId, bounds);

  output.push({
    id: node.id,
    sourceNodeId: node.id,
    stableNodeId,
    structuralSlot: path,
    variantRootId: context.variant.variantRootId,
    componentSetId: context.variant.componentSetId,
    key,
    pluginKey: pluginKey || null,
    semanticPath: path,
    parentKey,
    parentStableNodeId: context.ancestors.length
      ? context.ancestors[context.ancestors.length - 1].stableNodeId
      : null,
    siblingIndex,
    name: node.name || node.type,
    type: node.type,
    visible: node.visible !== false,
    opacity: number("opacity" in node ? node.opacity : 1),
    blendMode: "blendMode" in node ? node.blendMode : "NORMAL",
    clipsContent: "clipsContent" in node ? Boolean(node.clipsContent) : false,
    bounds,
    size: {
      width: number("width" in node ? node.width : absolute.width),
      height: number("height" in node ? node.height : absolute.height)
    },
    rotation: number("rotation" in node ? node.rotation : 0),
    relativeTransform: matrix("relativeTransform" in node ? node.relativeTransform : null),
    absoluteTransform: matrix("absoluteTransform" in node ? node.absoluteTransform : null),
    fills: paints("fills" in node ? node.fills : [], bounds),
    strokes: paints("strokes" in node ? node.strokes : [], bounds),
    strokeWeight: number("strokeWeight" in node && typeof node.strokeWeight === "number" ? node.strokeWeight : 0),
    cornerRadius: corners(node),
    vectorPaths: paths(node, stableNodeId),
    vectorNetwork: vectorNetwork(node),
    text: textData(node),
    mask,
    appliedMaskStableIds: context.appliedMasks.slice(),
    clip,
    clipHierarchy: context.ancestors.filter(item => item.clip).map(item => item.clip),
    effects: nodeEffects,
    filterHierarchy: context.ancestors.filter(item => item.filter).map(item => item.filter),
    reactions: clone(reactionsOf(node))
  });

  if (!("children" in node)) return;

  const nextAncestors = context.ancestors.concat({
    stableNodeId,
    clip: clip && clip.enabled ? clip : null,
    filter: nodeEffects.length ? { stableNodeId, effects: nodeEffects } : null
  });
  const names = new Map();
  const activeMasks = context.appliedMasks.slice();

  for (const child of node.children) {
    const base = normalizeName(child.name || child.type);
    const index = names.get(base) || 0;
    names.set(base, index + 1);
    const childPath = `${path}/${base}[${index}]`;

    walk(child, key, childPath, index, origin, output, options, {
      variant: context.variant,
      ancestors: nextAncestors,
      appliedMasks: activeMasks.slice()
    });

    if ("isMask" in child && child.isMask) {
      activeMasks.push(`${context.variant.componentSetId || context.variant.variantRootId}:${childPath}`);
    }
  }
}

function collectPrototype(roots, stateMap, rootIds) {
  const reactions = [];
  for (const root of roots) {
    visit(root, node => {
      for (const reaction of reactionsOf(node)) {
        reactions.push({
          id: `${node.id}:${reactions.length}`,
          sourceStateId: root.id,
          sourceNodeId: node.id,
          sourceNodeName: node.name || node.type,
          sourceLayerKey: stableKey(node, root),
          trigger: clone(reaction.trigger || { type: "ON_CLICK" }),
          actions: annotateActions(actionList(reaction), stateMap, rootIds)
        });
      }
    });
  }

  const points = Array.isArray(figma.currentPage.flowStartingPoints)
    ? figma.currentPage.flowStartingPoints.map(point => ({
        nodeId: point.nodeId,
        stateId: rootIds.has(point.nodeId) ? point.nodeId : stateMap.get(point.nodeId) || null,
        name: point.name || ""
      }))
    : [];

  return {
    version: 2,
    startStateId: null,
    flowStartingPoints: points,
    reactions,
    variables: [],
    variableCollections: []
  };
}

function annotateActions(actions, stateMap, rootIds) {
  return actions.map(action => annotateAction(action, stateMap, rootIds));
}

function annotateAction(action, stateMap, rootIds) {
  if (!action || typeof action !== "object") return action;
  const output = {};
  for (const [key, value] of Object.entries(action)) {
    if (Array.isArray(value)) output[key] = value.map(item => annotateAction(item, stateMap, rootIds));
    else if (value && typeof value === "object") output[key] = annotateAction(value, stateMap, rootIds);
    else output[key] = value;
  }
  if (action.destinationId) {
    output.destinationStateId = rootIds.has(action.destinationId)
      ? action.destinationId
      : stateMap.get(action.destinationId) || null;
  }
  return output;
}

function legacyTransitions(reactions) {
  const result = [];
  for (const reaction of reactions) {
    const action = findNodeAction(reaction.actions);
    if (!action || !action.destinationStateId) continue;
    result.push({
      from: reaction.sourceStateId,
      to: action.destinationStateId,
      sourceLayerId: reaction.sourceNodeId,
      trigger: reaction.trigger,
      navigation: action.navigation || null,
      transition: action.transition || {
        type: "SMART_ANIMATE",
        duration: 0.3,
        easing: { type: "EASE_OUT" }
      }
    });
  }
  return result;
}

function findNodeAction(actions) {
  for (const action of actions || []) {
    if (action && action.type === "NODE" && action.destinationStateId) return action;
    for (const value of Object.values(action || {})) {
      if (Array.isArray(value)) {
        const nested = findNodeAction(value);
        if (nested) return nested;
      }
    }
  }
  return null;
}

function orderStates(nodes) {
  return [...nodes].sort((a, b) => {
    const ay = a.absoluteBoundingBox ? a.absoluteBoundingBox.y : a.y || 0;
    const by = b.absoluteBoundingBox ? b.absoluteBoundingBox.y : b.y || 0;
    if (Math.abs(ay - by) > 8) return ay - by;
    const ax = a.absoluteBoundingBox ? a.absoluteBoundingBox.x : a.x || 0;
    const bx = b.absoluteBoundingBox ? b.absoluteBoundingBox.x : b.x || 0;
    return ax - bx;
  });
}

function variantContext(root) {
  const parent = root.parent && root.parent.type === "COMPONENT_SET" ? root.parent : null;
  const properties = "variantProperties" in root && root.variantProperties ? clone(root.variantProperties) : {};
  const variantKey = Object.keys(properties)
    .sort()
    .map(key => `${key}=${properties[key]}`)
    .join("|") || normalizeName(root.name || root.id);
  return {
    variantRootId: root.id,
    componentSetId: parent ? parent.id : null,
    componentSetName: parent ? parent.name : null,
    variantKey,
    properties
  };
}

function maskGeometry(node, stableNodeId, bounds) {
  if (!("isMask" in node) || !node.isMask) return null;
  return {
    stableNodeId,
    isMask: true,
    maskType: "maskType" in node ? node.maskType : "ALPHA",
    bounds,
    relativeTransform: matrix("relativeTransform" in node ? node.relativeTransform : null),
    absoluteTransform: matrix("absoluteTransform" in node ? node.absoluteTransform : null),
    vectorPaths: paths(node, `${stableNodeId}:mask`),
    cornerRadius: corners(node),
    fills: paints("fills" in node ? node.fills : [], bounds),
    strokes: paints("strokes" in node ? node.strokes : [], bounds),
    strokeWeight: number("strokeWeight" in node && typeof node.strokeWeight === "number" ? node.strokeWeight : 0)
  };
}

function clipGeometry(node, stableNodeId, bounds) {
  if (!("clipsContent" in node) || !node.clipsContent) return null;
  return {
    stableNodeId,
    enabled: true,
    bounds,
    cornerRadius: corners(node),
    relativeTransform: matrix("relativeTransform" in node ? node.relativeTransform : null),
    absoluteTransform: matrix("absoluteTransform" in node ? node.absoluteTransform : null),
    vectorPaths: paths(node, `${stableNodeId}:clip`)
  };
}

function effects(node) {
  if (!("effects" in node) || !Array.isArray(node.effects)) return [];
  return node.effects
    .filter(effect => effect && effect.visible !== false)
    .map(effect => ({
      type: effect.type,
      visible: effect.visible !== false,
      radius: number(effect.radius || 0),
      spread: number(effect.spread || 0),
      offset: effect.offset ? point(effect.offset) : null,
      color: effect.color ? color(effect.color) : null,
      blendMode: effect.blendMode || "NORMAL",
      showShadowBehindNode: Boolean(effect.showShadowBehindNode)
    }));
}

function vectorNetwork(node) {
  if (!("vectorNetwork" in node) || !node.vectorNetwork) return null;
  try {
    const network = node.vectorNetwork;
    return {
      vertices: (network.vertices || []).map((vertex, index) => ({
        index,
        x: number(vertex.x),
        y: number(vertex.y),
        strokeCap: vertex.strokeCap || null,
        strokeJoin: vertex.strokeJoin || null,
        cornerRadius: number(vertex.cornerRadius || 0),
        handleMirroring: vertex.handleMirroring || null
      })),
      segments: (network.segments || []).map((segment, index) => ({
        index,
        start: segment.start,
        end: segment.end,
        tangentStart: segment.tangentStart ? point(segment.tangentStart) : null,
        tangentEnd: segment.tangentEnd ? point(segment.tangentEnd) : null
      })),
      regions: (network.regions || []).map((region, index) => ({
        index,
        loops: clone(region.loops || []),
        windingRule: region.windingRule || null
      }))
    };
  } catch (_error) {
    return null;
  }
}

function pathTopology(data) {
  const tokens = String(data || "").match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  const commands = tokens.filter(token => /^[a-zA-Z]$/.test(token));
  const parameters = tokens.filter(token => !/^[a-zA-Z]$/.test(token));
  const signature = commands.join("");
  const closedSubpaths = commands.filter(command => command.toUpperCase() === "Z").length;
  return {
    signature,
    commands,
    commandCount: commands.length,
    parameterCount: parameters.length,
    closedSubpaths,
    compatibleKey: `${signature}:${parameters.length}:${closedSubpaths}`
  };
}

function gradientTransform(handles, bounds) {
  if (!Array.isArray(handles) || handles.length < 3) return null;
  const p0 = handles[0], p1 = handles[1], p2 = handles[2];
  const width = bounds ? bounds.width : 1;
  const height = bounds ? bounds.height : 1;
  const x = bounds ? bounds.x : 0;
  const y = bounds ? bounds.y : 0;
  return {
    normalized: [
      [number(p1.x - p0.x), number(p2.x - p0.x), number(p0.x)],
      [number(p1.y - p0.y), number(p2.y - p0.y), number(p0.y)],
      [0, 0, 1]
    ],
    userSpace: [
      [number((p1.x - p0.x) * width), number((p2.x - p0.x) * width), number(x + p0.x * width)],
      [number((p1.y - p0.y) * height), number((p2.y - p0.y) * height), number(y + p0.y * height)],
      [0, 0, 1]
    ]
  };
}

function paints(value, bounds) {
  if (!Array.isArray(value)) return [];
  return value.filter(item => item && item.visible !== false).map(item => {
    const output = {
      type: item.type,
      visible: item.visible !== false,
      opacity: number(item.opacity == null ? 1 : item.opacity),
      blendMode: item.blendMode || "NORMAL"
    };
    if (item.color) output.color = color(item.color, item.opacity);
    if (item.gradientStops) {
      output.gradientStops = item.gradientStops.map(stop => ({
        position: number(stop.position),
        color: color(stop.color)
      }));
    }
    if (item.gradientHandlePositions) {
      output.gradientHandlePositions = item.gradientHandlePositions.map(point);
      output.gradientTransform = gradientTransform(item.gradientHandlePositions, bounds);
    }
    if (item.imageHash) output.imageHash = item.imageHash;
    if (item.scaleMode) output.scaleMode = item.scaleMode;
    if (item.rotation != null) output.rotation = number(item.rotation);
    return output;
  });
}

function paths(node, stableNodeId) {
  return "vectorPaths" in node && Array.isArray(node.vectorPaths)
    ? node.vectorPaths.map((path, index) => ({
        id: `${stableNodeId}:path:${index}`,
        correspondenceId: `${stableNodeId}:path:${index}`,
        data: path.data,
        windingRule: path.windingRule,
        topology: pathTopology(path.data)
      }))
    : [];
}

function textData(node) {
  if (node.type !== "TEXT") return null;
  return {
    characters: node.characters,
    fontSize: typeof node.fontSize === "number" ? number(node.fontSize) : null,
    fontName: node.fontName && node.fontName !== figma.mixed ? clone(node.fontName) : null,
    fontWeight: typeof node.fontWeight === "number" ? node.fontWeight : null,
    textAlignHorizontal: node.textAlignHorizontal,
    textAlignVertical: node.textAlignVertical,
    textAutoResize: node.textAutoResize,
    lineHeight: node.lineHeight && node.lineHeight !== figma.mixed ? clone(node.lineHeight) : null,
    letterSpacing: node.letterSpacing && node.letterSpacing !== figma.mixed ? clone(node.letterSpacing) : null
  };
}

function corners(node) {
  if (!("cornerRadius" in node)) return null;
  if (typeof node.cornerRadius === "number") return { all: number(node.cornerRadius) };
  return {
    topLeft: number(node.topLeftRadius || 0),
    topRight: number(node.topRightRadius || 0),
    bottomRight: number(node.bottomRightRadius || 0),
    bottomLeft: number(node.bottomLeftRadius || 0)
  };
}

async function exportSvg(node) {
  const bytes = await node.exportAsync({ format: "SVG" });
  const svg = decodeUtf8(bytes);
  if (!svg || svg.indexOf("<svg") < 0) throw new Error(`Figma trả về SVG không hợp lệ cho state "${node.name}".`);
  return svg;
}

function decodeUtf8(bytes) {
  let output = "";
  let index = 0;
  while (index < bytes.length) {
    const first = bytes[index++];
    if (first < 128) { output += String.fromCharCode(first); continue; }
    if ((first & 224) === 192) {
      const second = bytes[index++];
      output += String.fromCharCode(((first & 31) << 6) | (second & 63));
      continue;
    }
    if ((first & 240) === 224) {
      const second = bytes[index++], third = bytes[index++];
      output += String.fromCharCode(((first & 15) << 12) | ((second & 63) << 6) | (third & 63));
      continue;
    }
    if ((first & 248) === 240) {
      const second = bytes[index++], third = bytes[index++], fourth = bytes[index++];
      let codePoint = ((first & 7) << 18) | ((second & 63) << 12) | ((third & 63) << 6) | (fourth & 63);
      codePoint -= 65536;
      output += String.fromCharCode(55296 + (codePoint >> 10), 56320 + (codePoint & 1023));
      continue;
    }
    output += "�";
  }
  return output;
}

function stableKey(node, root) {
  if (node.id === root.id) return "@root";
  return pluginData(node) || normalizeName(node.name || node.type);
}
function isState(node) { return node && ["FRAME", "COMPONENT", "INSTANCE", "COMPONENT_SET"].includes(node.type); }
function mapState(node, stateId, map) { map.set(node.id, stateId); if ("children" in node) node.children.forEach(child => mapState(child, stateId, map)); }
function visit(node, callback) { callback(node); if ("children" in node) node.children.forEach(child => visit(child, callback)); }
function reactionsOf(node) { return "reactions" in node && Array.isArray(node.reactions) ? node.reactions : []; }
function actionList(reaction) { return Array.isArray(reaction.actions) ? reaction.actions : reaction.action ? [reaction.action] : []; }
function pluginData(node) { try { return node.getSharedPluginData(NS, KEY) || node.getPluginData(KEY) || ""; } catch (_error) { return ""; } }
function color(value, opacity) { return { r: number(value.r), g: number(value.g), b: number(value.b), a: number(value.a == null ? (opacity == null ? 1 : opacity) : value.a) }; }
function point(value) { return { x: number(value.x), y: number(value.y) }; }
function matrix(value) { return Array.isArray(value) ? value.map(row => row.map(number)) : null; }
function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? Math.round(parsed * 1e5) / 1e5 : 0; }
function normalizeName(value) { return String(value || "layer").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]+/g, "").replace(/-+/g, "-") || "layer"; }
function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
