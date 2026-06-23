figma.showUI(__html__, { width: 420, height: 360, themeColors: true });

const NS = "svg-motion-lab";
const KEY = "motion-id";

figma.ui.onmessage = async message => {
  if (!message || message.type !== "export") return;
  try {
    figma.ui.postMessage({ type: "manifest", manifest: await exportManifest(message.options || {}) });
  } catch (error) {
    figma.ui.postMessage({ type: "error", message: error && error.message ? error.message : String(error) });
  }
};

async function exportManifest(options) {
  await figma.loadAllPagesAsync();
  const selected = figma.currentPage.selection.filter(isState);
  const candidates = selected.length ? selected : figma.currentPage.children.filter(isState);
  if (!candidates.length) throw new Error("Hãy chọn ít nhất một Frame, Component hoặc Instance state.");

  const stateMap = new Map();
  candidates.forEach(root => mapState(root, root.id, stateMap));
  const rootIds = new Set(candidates.map(root => root.id));
  const orderedRoots = orderStateNodes(candidates, stateMap, rootIds);
  const states = [];

  for (let index = 0; index < orderedRoots.length; index += 1) {
    const root = orderedRoots[index];
    const absolute = root.absoluteBoundingBox || { x: root.x || 0, y: root.y || 0 };
    figma.ui.postMessage({ type: "progress", message: `Đang export ${index + 1}/${orderedRoots.length}: ${root.name}` });
    const layers = [];
    walk(root, null, "@root", 0, { x: absolute.x || 0, y: absolute.y || 0 }, layers, options);
    states.push({
      id: root.id,
      name: root.name,
      order: index,
      width: number(root.width),
      height: number(root.height),
      prototypeSettings: prototypeSettings(root),
      layers,
      svg: options.includeStateSvg ? await exportSvg(root) : null
    });
  }

  const prototype = await collectPrototype(orderedRoots, stateMap, rootIds);
  prototype.startStateId = states[0].id;
  const transitions = legacyTransitions(prototype.reactions);

  return {
    schema: "svg-motion-lab/figma-manifest@3",
    exportedAt: new Date().toISOString(),
    source: {
      fileName: figma.root.name,
      pageId: figma.currentPage.id,
      pageName: figma.currentPage.name
    },
    startNodeId: states[0].id,
    stateOrder: states.map(state => state.id),
    states,
    prototype,
    transitions,
    calibration: {
      geometryPrecision: 4,
      gradientPrecision: 5,
      springSamples: 36,
      renderMode: "prototype",
      layerMatchOrder: ["pluginKey", "semanticPath", "nameTypeScore"]
    }
  };
}

async function collectPrototype(roots, stateMap, rootIds) {
  const reactions = [];
  for (const root of roots) {
    visit(root, node => {
      const layerKey = stableKey(node, root);
      for (const reaction of reactionsOf(node)) {
        reactions.push({
          id: `${node.id}:${reactions.length}`,
          sourceStateId: root.id,
          sourceNodeId: node.id,
          sourceNodeName: node.name || node.type,
          sourceLayerKey: layerKey,
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

  const variableData = await readVariables();
  const firstPoint = points.find(point => point.stateId);
  return {
    version: 1,
    startStateId: firstPoint ? firstPoint.stateId : null,
    flowStartingPoints: points,
    reactions,
    variables: variableData.variables,
    variableCollections: variableData.collections
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
      transition: action.transition || { type: "SMART_ANIMATE", duration: 0.3, easing: { type: "EASE_OUT" } }
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

function orderStateNodes(nodes, stateMap, rootIds) {
  const outgoing = new Map();
  const incoming = new Set();
  for (const root of nodes) {
    visit(root, node => {
      for (const reaction of reactionsOf(node)) {
        const actions = annotateActions(actionList(reaction), stateMap, rootIds);
        const action = findNodeAction(actions);
        if (!action || !action.destinationStateId || action.destinationStateId === root.id) continue;
        if (!outgoing.has(root.id)) outgoing.set(root.id, action.destinationStateId);
        incoming.add(action.destinationStateId);
      }
    });
  }

  const flowPoints = Array.isArray(figma.currentPage.flowStartingPoints) ? figma.currentPage.flowStartingPoints : [];
  let startId = flowPoints.map(point => rootIds.has(point.nodeId) ? point.nodeId : stateMap.get(point.nodeId)).find(Boolean);
  if (!startId) {
    const namedStart = nodes.find(node => /^(1st|start|initial|first)$/i.test(String(node.name || "").trim()));
    if (namedStart) startId = namedStart.id;
  }
  if (!startId) {
    const graphStart = nodes.find(node => outgoing.has(node.id) && !incoming.has(node.id));
    if (graphStart) startId = graphStart.id;
  }

  const canvasOrder = [...nodes].sort((a, b) => {
    const ay = a.absoluteBoundingBox ? a.absoluteBoundingBox.y : a.y || 0;
    const by = b.absoluteBoundingBox ? b.absoluteBoundingBox.y : b.y || 0;
    if (Math.abs(ay - by) > 8) return ay - by;
    const ax = a.absoluteBoundingBox ? a.absoluteBoundingBox.x : a.x || 0;
    const bx = b.absoluteBoundingBox ? b.absoluteBoundingBox.x : b.x || 0;
    return ax - bx;
  });
  if (!startId) startId = canvasOrder[0].id;

  const ordered = [];
  const seen = new Set();
  let current = startId;
  while (current && rootIds.has(current) && !seen.has(current)) {
    seen.add(current);
    ordered.push(nodes.find(node => node.id === current));
    current = outgoing.get(current);
  }
  for (const node of canvasOrder) if (!seen.has(node.id)) ordered.push(node);
  return ordered.filter(Boolean);
}

function walk(node, parentKey, path, siblingIndex, origin, output, options) {
  if (!options.includeHidden && node.visible === false) return;
  const pluginKey = pluginData(node);
  const key = pluginKey || path;
  const absolute = node.absoluteBoundingBox || { x: node.x || 0, y: node.y || 0, width: node.width || 0, height: node.height || 0 };
  output.push({
    id: node.id,
    key,
    pluginKey: pluginKey || null,
    semanticPath: path,
    parentKey,
    siblingIndex,
    name: node.name || node.type,
    type: node.type,
    visible: node.visible !== false,
    opacity: number("opacity" in node ? node.opacity : 1),
    blendMode: "blendMode" in node ? node.blendMode : "NORMAL",
    clipsContent: "clipsContent" in node ? Boolean(node.clipsContent) : false,
    bounds: { x: number(absolute.x - origin.x), y: number(absolute.y - origin.y), width: number(absolute.width), height: number(absolute.height) },
    size: { width: number("width" in node ? node.width : absolute.width), height: number("height" in node ? node.height : absolute.height) },
    rotation: number("rotation" in node ? node.rotation : 0),
    relativeTransform: matrix("relativeTransform" in node ? node.relativeTransform : null),
    fills: paints("fills" in node ? node.fills : []),
    strokes: paints("strokes" in node ? node.strokes : []),
    strokeWeight: number("strokeWeight" in node && typeof node.strokeWeight === "number" ? node.strokeWeight : 0),
    cornerRadius: corners(node),
    vectorPaths: paths(node),
    text: textData(node),
    reactions: clone(reactionsOf(node))
  });
  if (!("children" in node)) return;
  const names = new Map();
  for (const child of node.children) {
    const base = normalizeName(child.name || child.type);
    const index = names.get(base) || 0;
    names.set(base, index + 1);
    walk(child, key, `${path}/${base}[${index}]`, index, origin, output, options);
  }
}

async function readVariables() {
  if (!figma.variables) return { variables: [], collections: [] };
  try {
    const variables = figma.variables.getLocalVariablesAsync ? await figma.variables.getLocalVariablesAsync() : [];
    const collections = figma.variables.getLocalVariableCollectionsAsync ? await figma.variables.getLocalVariableCollectionsAsync() : [];
    return {
      variables: variables.map(variable => ({ id: variable.id, name: variable.name, resolvedType: variable.resolvedType, variableCollectionId: variable.variableCollectionId, valuesByMode: clone(variable.valuesByMode || {}), scopes: clone(variable.scopes || []) })),
      collections: collections.map(collection => ({ id: collection.id, name: collection.name, defaultModeId: collection.defaultModeId, modes: clone(collection.modes || []) }))
    };
  } catch (_error) {
    return { variables: [], collections: [] };
  }
}

function prototypeSettings(node) {
  const keys = ["overlayPositionType", "overlayBackground", "overlayBackgroundInteraction", "overflowDirection"];
  const output = {};
  for (const key of keys) if (key in node) output[key] = clone(node[key]);
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
function paints(value) { if (!Array.isArray(value)) return []; return value.filter(item => item && item.visible !== false).map(item => { const output = { type: item.type, visible: item.visible !== false, opacity: number(item.opacity == null ? 1 : item.opacity), blendMode: item.blendMode || "NORMAL" }; if (item.color) output.color = color(item.color, item.opacity); if (item.gradientStops) output.gradientStops = item.gradientStops.map(stop => ({ position: number(stop.position), color: color(stop.color) })); if (item.gradientHandlePositions) output.gradientHandlePositions = item.gradientHandlePositions.map(point); if (item.imageHash) output.imageHash = item.imageHash; return output; }); }
function paths(node) { return "vectorPaths" in node && Array.isArray(node.vectorPaths) ? node.vectorPaths.map(path => ({ data: path.data, windingRule: path.windingRule })) : []; }
function textData(node) { if (node.type !== "TEXT") return null; return { characters: node.characters, fontSize: typeof node.fontSize === "number" ? number(node.fontSize) : null, fontName: node.fontName && node.fontName !== figma.mixed ? clone(node.fontName) : null, fontWeight: typeof node.fontWeight === "number" ? node.fontWeight : null, textAlignHorizontal: node.textAlignHorizontal, textAlignVertical: node.textAlignVertical }; }
function corners(node) { if (!("cornerRadius" in node)) return null; if (typeof node.cornerRadius === "number") return { all: number(node.cornerRadius) }; return { topLeft: number(node.topLeftRadius || 0), topRight: number(node.topRightRadius || 0), bottomRight: number(node.bottomRightRadius || 0), bottomLeft: number(node.bottomLeftRadius || 0) }; }
async function exportSvg(node) { try { return new TextDecoder("utf-8").decode(await node.exportAsync({ format: "SVG", svgIdAttribute: true, svgOutlineText: false, svgSimplifyStroke: false })); } catch (_error) { return null; } }
function color(value, opacity) { return { r: number(value.r), g: number(value.g), b: number(value.b), a: number(value.a == null ? (opacity == null ? 1 : opacity) : value.a) }; }
function point(value) { return { x: number(value.x), y: number(value.y) }; }
function matrix(value) { return Array.isArray(value) ? value.map(row => row.map(number)) : null; }
function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? Math.round(parsed * 1e5) / 1e5 : 0; }
function normalizeName(value) { return String(value || "layer").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]+/g, "").replace(/-+/g, "-") || "layer"; }
function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
