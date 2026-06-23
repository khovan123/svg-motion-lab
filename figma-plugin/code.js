figma.showUI(__html__, { width: 420, height: 360, themeColors: true });

const NS = "svg-motion-lab";
const KEY = "motion-id";

figma.ui.onmessage = async message => {
  if (!message || message.type !== "export") return;
  try {
    figma.ui.postMessage({
      type: "manifest",
      manifest: await exportManifest(message.options || {})
    });
  } catch (error) {
    figma.ui.postMessage({
      type: "error",
      message: error && error.message ? error.message : String(error)
    });
  }
};

async function exportManifest(options) {
  await figma.loadAllPagesAsync();

  const selected = figma.currentPage.selection.filter(isState);
  const candidates = selected.length
    ? selected
    : figma.currentPage.children.filter(isState);

  if (!candidates.length) {
    throw new Error("Hãy chọn ít nhất một Frame, Component hoặc Instance state.");
  }

  const statesNodes = orderStateNodes(candidates);
  const nodeState = new Map();
  const rootIds = new Set(statesNodes.map(node => node.id));
  statesNodes.forEach(root => mapState(root, root.id, nodeState));

  const states = [];
  for (let index = 0; index < statesNodes.length; index += 1) {
    const root = statesNodes[index];
    const absolute = root.absoluteBoundingBox || { x: root.x || 0, y: root.y || 0 };

    figma.ui.postMessage({
      type: "progress",
      message: `Đang export ${index + 1}/${statesNodes.length}: ${root.name}`
    });

    const layers = [];
    walk(
      root,
      null,
      "@root",
      0,
      { x: absolute.x || 0, y: absolute.y || 0 },
      layers,
      options
    );

    states.push({
      id: root.id,
      name: root.name,
      order: index,
      width: number(root.width),
      height: number(root.height),
      layers,
      svg: options.includeStateSvg ? await exportSvg(root) : null
    });
  }

  return {
    schema: "svg-motion-lab/figma-manifest@2",
    exportedAt: new Date().toISOString(),
    source: {
      fileName: figma.root.name,
      pageId: figma.currentPage.id,
      pageName: figma.currentPage.name
    },
    startNodeId: states[0].id,
    stateOrder: states.map(state => state.id),
    states,
    transitions: transitions(states, nodeState, rootIds),
    calibration: {
      geometryPrecision: 4,
      gradientPrecision: 5,
      springSamples: 36,
      renderMode: "auto",
      layerMatchOrder: ["pluginKey", "semanticPath", "nameTypeScore"]
    }
  };
}

function orderStateNodes(nodes) {
  const nodeState = new Map();
  const rootIds = new Set(nodes.map(node => node.id));
  nodes.forEach(root => mapState(root, root.id, nodeState));

  const outgoing = new Map();
  const incoming = new Set();

  for (const root of nodes) {
    visit(root, node => {
      for (const reaction of reactionList(node)) {
        for (const action of reactionActions(reaction)) {
          if (!action || action.type !== "NODE" || !action.destinationId) continue;
          const destination = rootIds.has(action.destinationId)
            ? action.destinationId
            : nodeState.get(action.destinationId);
          if (!destination || destination === root.id) continue;
          if (!outgoing.has(root.id)) outgoing.set(root.id, destination);
          incoming.add(destination);
        }
      }
    });
  }

  const flowPoints = Array.isArray(figma.currentPage.flowStartingPoints)
    ? figma.currentPage.flowStartingPoints
    : [];

  let startId = flowPoints
    .map(point => rootIds.has(point.nodeId) ? point.nodeId : nodeState.get(point.nodeId))
    .find(Boolean);

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

  for (const node of canvasOrder) {
    if (!seen.has(node.id)) ordered.push(node);
  }

  return ordered.filter(Boolean);
}

function isState(node) {
  return node && ["FRAME", "COMPONENT", "INSTANCE", "COMPONENT_SET"].includes(node.type);
}

function mapState(node, stateId, target) {
  target.set(node.id, stateId);
  if ("children" in node) node.children.forEach(child => mapState(child, stateId, target));
}

function visit(node, callback) {
  callback(node);
  if ("children" in node) node.children.forEach(child => visit(child, callback));
}

function reactionList(node) {
  return "reactions" in node && Array.isArray(node.reactions) ? node.reactions : [];
}

function reactionActions(reaction) {
  if (!reaction) return [];
  if (Array.isArray(reaction.actions)) return reaction.actions;
  return reaction.action ? [reaction.action] : [];
}

function walk(node, parentKey, path, siblingIndex, origin, output, options) {
  if (!options.includeHidden && node.visible === false) return;

  const pluginKey = data(node);
  const key = pluginKey || path;
  const absolute = node.absoluteBoundingBox || {
    x: node.x || 0,
    y: node.y || 0,
    width: node.width || 0,
    height: node.height || 0
  };

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
    bounds: {
      x: number(absolute.x - origin.x),
      y: number(absolute.y - origin.y),
      width: number(absolute.width),
      height: number(absolute.height)
    },
    size: {
      width: number("width" in node ? node.width : absolute.width),
      height: number("height" in node ? node.height : absolute.height)
    },
    rotation: number("rotation" in node ? node.rotation : 0),
    relativeTransform: matrix("relativeTransform" in node ? node.relativeTransform : null),
    fills: paints("fills" in node ? node.fills : []),
    strokes: paints("strokes" in node ? node.strokes : []),
    strokeWeight: number("strokeWeight" in node && typeof node.strokeWeight === "number" ? node.strokeWeight : 0),
    cornerRadius: corners(node),
    vectorPaths: paths(node),
    text: text(node),
    reactions: clone(reactionList(node))
  });

  if (!("children" in node)) return;

  const siblingNames = new Map();
  for (const child of node.children) {
    const base = normalizeName(child.name || child.type);
    const index = siblingNames.get(base) || 0;
    siblingNames.set(base, index + 1);
    walk(child, key, `${path}/${base}[${index}]`, index, origin, output, options);
  }
}

function paints(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(paint => paint && paint.visible !== false).map(paint => {
    const result = {
      type: paint.type,
      visible: paint.visible !== false,
      opacity: number(paint.opacity == null ? 1 : paint.opacity),
      blendMode: paint.blendMode || "NORMAL"
    };
    if (paint.color) result.color = color(paint.color, paint.opacity);
    if (paint.gradientStops) {
      result.gradientStops = paint.gradientStops.map(stop => ({
        position: number(stop.position),
        color: color(stop.color)
      }));
    }
    if (paint.gradientHandlePositions) result.gradientHandlePositions = paint.gradientHandlePositions.map(point);
    if (paint.imageHash) result.imageHash = paint.imageHash;
    return result;
  });
}

function paths(node) {
  return "vectorPaths" in node && Array.isArray(node.vectorPaths)
    ? node.vectorPaths.map(path => ({ data: path.data, windingRule: path.windingRule }))
    : [];
}

function text(node) {
  if (node.type !== "TEXT") return null;
  return {
    characters: node.characters,
    fontSize: typeof node.fontSize === "number" ? number(node.fontSize) : null,
    fontName: node.fontName && node.fontName !== figma.mixed ? clone(node.fontName) : null,
    fontWeight: typeof node.fontWeight === "number" ? node.fontWeight : null,
    textAlignHorizontal: node.textAlignHorizontal,
    textAlignVertical: node.textAlignVertical
  };
}

function transitions(states, nodeState, rootIds) {
  const result = new Map();
  for (const state of states) {
    for (const layer of state.layers) {
      for (const reaction of layer.reactions || []) {
        for (const action of reactionActions(reaction)) {
          if (!action || action.type !== "NODE" || !action.destinationId) continue;
          const destination = rootIds.has(action.destinationId)
            ? action.destinationId
            : nodeState.get(action.destinationId);
          if (!destination || destination === state.id) continue;
          result.set(`${state.id}>${destination}`, {
            from: state.id,
            to: destination,
            sourceLayerId: layer.id,
            trigger: reaction.trigger || null,
            navigation: action.navigation || null,
            transition: action.transition || {
              type: "SMART_ANIMATE",
              duration: 0.3,
              easing: { type: "EASE_OUT" }
            }
          });
        }
      }
    }
  }
  return [...result.values()];
}

async function exportSvg(node) {
  try {
    return new TextDecoder("utf-8").decode(await node.exportAsync({
      format: "SVG",
      svgIdAttribute: true,
      svgOutlineText: false,
      svgSimplifyStroke: false
    }));
  } catch (_error) {
    return null;
  }
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

function data(node) {
  try {
    return node.getSharedPluginData(NS, KEY) || node.getPluginData(KEY) || "";
  } catch (_error) {
    return "";
  }
}

function color(value, opacity) {
  return {
    r: number(value.r),
    g: number(value.g),
    b: number(value.b),
    a: number(value.a == null ? (opacity == null ? 1 : opacity) : value.a)
  };
}

function point(value) {
  return { x: number(value.x), y: number(value.y) };
}

function matrix(value) {
  return Array.isArray(value) ? value.map(row => row.map(number)) : null;
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 1e5) / 1e5 : 0;
}

function normalizeName(value) {
  return String(value || "layer")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]+/g, "")
    .replace(/-+/g, "-") || "layer";
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
