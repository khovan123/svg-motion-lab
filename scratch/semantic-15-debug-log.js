(function(root){
'use strict';
const previous=root.SvgMotionCompiler;
const S=root.__SMC;
if(!previous||!S)return;
const SVG_NS='http://www.w3.org/2000/svg';
const NUMERIC=['x','y','x1','y1','x2','y2','cx','cy','r','rx','ry','width','height','opacity','fill-opacity','stroke-opacity','stroke-width','stroke-dashoffset'];
const COLOR=['fill','stroke','color','stop-color','flood-color','lighting-color'];

function parseTransform(value) {
  const text = String(value || '').trim();
  if (!text) return [1, 0, 0, 1, 0, 0];
  let m;
  if ((m = text.match(/^matrix\(\s*([-+\deE.]+)[ ,]+([-+\deE.]+)[ ,]+([-+\deE.]+)[ ,]+([-+\deE.]+)[ ,]+([-+\deE.]+)[ ,]+([-+\deE.]+)\s*\)$/))) return m.slice(1).map(Number);
  if ((m = text.match(/^translate\(\s*([-+\deE.]+)(?:[ ,]+([-+\deE.]+))?\s*\)$/))) return [1, 0, 0, 1, Number(m[1]), Number(m[2] || 0)];
  if ((m = text.match(/^scale\(\s*([-+\deE.]+)(?:[ ,]+([-+\deE.]+))?\s*\)$/))) {
    const x = Number(m[1]), y = Number(m[2] || m[1]);
    return [x, 0, 0, y, 0, 0];
  }
  return [1, 0, 0, 1, 0, 0];
}

function getElementTransform(el) {
  let matrix = [1, 0, 0, 1, 0, 0];
  let current = el;
  const list = [];
  while (current && current.tagName && current.tagName.toLowerCase() !== 'svg') {
    list.unshift(current);
    current = current.parentNode;
  }
  const multiply = (m1, m2) => [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
  ];
  list.forEach(node => {
    const tStr = node.getAttribute('transform');
    if (tStr) {
      const m = parseTransform(tStr);
      if (m) matrix = multiply(matrix, m);
    }
  });
  return matrix;
}

function getPathBounds(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let cx = 0, cy = 0;
  const update = (x, y) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (/^[a-zA-Z]$/.test(token)) {
      const cmd = token;
      i++;
      if (cmd === 'M' || cmd === 'L' || cmd === 'T') {
        cx = Number(tokens[i++]); cy = Number(tokens[i++]);
        update(cx, cy);
      } else if (cmd === 'm' || cmd === 'l' || cmd === 't') {
        cx += Number(tokens[i++]); cy += Number(tokens[i++]);
        update(cx, cy);
      } else if (cmd === 'H') {
        cx = Number(tokens[i++]);
        update(cx, cy);
      } else if (cmd === 'h') {
        cx += Number(tokens[i++]);
        update(cx, cy);
      } else if (cmd === 'V') {
        cy = Number(tokens[i++]);
        update(cx, cy);
      } else if (cmd === 'v') {
        cy += Number(tokens[i++]);
        update(cx, cy);
      } else if (cmd === 'C') {
        const x1 = Number(tokens[i++]), y1 = Number(tokens[i++]);
        const x2 = Number(tokens[i++]), y2 = Number(tokens[i++]);
        cx = Number(tokens[i++]); cy = Number(tokens[i++]);
        update(x1, y1); update(x2, y2); update(cx, cy);
      } else if (cmd === 'c') {
        const x1 = cx + Number(tokens[i++]), y1 = cy + Number(tokens[i++]);
        const x2 = cx + Number(tokens[i++]), y2 = cy + Number(tokens[i++]);
        cx += Number(tokens[i++]); cy += Number(tokens[i++]);
        update(x1, y1); update(x2, y2); update(cx, cy);
      } else if (cmd === 'S') {
        const x2 = Number(tokens[i++]), y2 = Number(tokens[i++]);
        cx = Number(tokens[i++]); cy = Number(tokens[i++]);
        update(x2, y2); update(cx, cy);
      } else if (cmd === 's') {
        const x2 = cx + Number(tokens[i++]), y2 = cy + Number(tokens[i++]);
        cx += Number(tokens[i++]); cy += Number(tokens[i++]);
        update(x2, y2); update(cx, cy);
      } else if (cmd === 'Q') {
        const x1 = Number(tokens[i++]), y1 = Number(tokens[i++]);
        cx = Number(tokens[i++]); cy = Number(tokens[i++]);
        update(x1, y1); update(cx, cy);
      } else if (cmd === 'q') {
        const x1 = cx + Number(tokens[i++]), y1 = cy + Number(tokens[i++]);
        cx += Number(tokens[i++]); cy += Number(tokens[i++]);
        update(x1, y1); update(cx, cy);
      } else if (cmd === 'A') {
        const rx = Number(tokens[i++]), ry = Number(tokens[i++]);
        const rot = Number(tokens[i++]), laf = Number(tokens[i++]), sf = Number(tokens[i++]);
        cx = Number(tokens[i++]); cy = Number(tokens[i++]);
        update(cx, cy);
      } else if (cmd === 'a') {
        const rx = Number(tokens[i++]), ry = Number(tokens[i++]);
        const rot = Number(tokens[i++]), laf = Number(tokens[i++]), sf = Number(tokens[i++]);
        cx += Number(tokens[i++]); cy += Number(tokens[i++]);
        update(cx, cy);
      }
    } else {
      i++;
    }
  }
  if (minX === Infinity) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function getAbsoluteBounds(el) {
  let local = null;
  const tag = el.tagName.toLowerCase();
  if (tag === 'rect') {
    local = {
      x: Number(el.getAttribute('x') || 0),
      y: Number(el.getAttribute('y') || 0),
      width: Number(el.getAttribute('width') || 0),
      height: Number(el.getAttribute('height') || 0)
    };
  } else if (tag === 'circle') {
    const cx = Number(el.getAttribute('cx') || 0);
    const cy = Number(el.getAttribute('cy') || 0);
    const r = Number(el.getAttribute('r') || 0);
    local = { x: cx - r, y: cy - r, width: 2*r, height: 2*r };
  } else if (tag === 'ellipse') {
    const cx = Number(el.getAttribute('cx') || 0);
    const cy = Number(el.getAttribute('cy') || 0);
    const rx = Number(el.getAttribute('rx') || 0);
    const ry = Number(el.getAttribute('ry') || 0);
    local = { x: cx - rx, y: cy - ry, width: 2*rx, height: 2*ry };
  } else if (tag === 'path') {
    local = getPathBounds(el.getAttribute('d') || '');
  } else if (tag === 'text') {
    if (typeof el.getBBox === 'function') {
      const box = el.getBBox();
      local = { x: box.x, y: box.y, width: box.width, height: box.height };
    }
  } else if (tag === 'g') {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    Array.from(el.children).forEach(child => {
      const childTag = child.tagName.toLowerCase();
      if (['rect', 'circle', 'ellipse', 'path', 'g', 'text'].includes(childTag)) {
        const cb = getAbsoluteBounds(child);
        if (cb) {
          if (cb.x < minX) minX = cb.x;
          if (cb.x + cb.width > maxX) maxX = cb.x + cb.width;
          if (cb.y < minY) minY = cb.y;
          if (cb.y + cb.height > maxY) maxY = cb.y + cb.height;
        }
      }
    });
    if (minX !== Infinity) {
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    return null;
  }
  
  if (!local) return null;
  
  const m = getElementTransform(el);
  const corners = [
    [local.x, local.y],
    [local.x + local.width, local.y],
    [local.x, local.y + local.height],
    [local.x + local.width, local.y + local.height]
  ];
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  corners.forEach(([lx, ly]) => {
    const tx = m[0] * lx + m[2] * ly + m[4];
    const ty = m[1] * lx + m[3] * ly + m[5];
    if (tx < minX) minX = tx;
    if (tx > maxX) maxX = tx;
    if (ty < minY) minY = ty;
    if (ty > maxY) maxY = ty;
  });
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function isTagCompatible(tag, type) {
  tag = tag.toLowerCase();
  if (type === 'RECTANGLE') return tag === 'rect' || tag === 'path';
  if (type === 'ELLIPSE') return tag === 'ellipse' || tag === 'circle' || tag === 'path';
  if (['VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'POLYGON'].includes(type)) return tag === 'path';
  if (type === 'TEXT') return tag === 'text' || tag === 'g' || tag === 'path';
  if (['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET'].includes(type)) return tag === 'g' || tag === 'rect' || tag === 'path';
  return false;
}

function convertRectToPath(rect) {
  const x = Number(rect.getAttribute('x') || 0);
  const y = Number(rect.getAttribute('y') || 0);
  const w = Number(rect.getAttribute('width') || 0);
  const h = Number(rect.getAttribute('height') || 0);
  const rx = Number(rect.getAttribute('rx') || rect.getAttribute('ry') || 0);
  const ry = Number(rect.getAttribute('ry') || rect.getAttribute('rx') || 0);
  
  const path = rect.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'path');
  for (const attr of rect.getAttributeNames()) {
    if (!['x', 'y', 'width', 'height', 'rx', 'ry'].includes(attr)) {
      path.setAttribute(attr, rect.getAttribute(attr));
    }
  }
  
  const k = 0.55228474983;
  const d = `M${x} ${y + ry}` +
            `C${x} ${y + ry - ry * k} ${x + rx - rx * k} ${y} ${x + rx} ${y}` +
            `H${x + w - rx}` +
            `C${x + w - rx + rx * k} ${y} ${x + w} ${y + ry - ry * k} ${x + w} ${y + ry}` +
            `V${y + h - ry}` +
            `C${x + w} ${y + h - ry + ry * k} ${x + w - rx + rx * k} ${y + h} ${x + w - rx} ${y + h}` +
            `H${x + rx}` +
            `C${x + rx - rx * k} ${y + h} ${x} ${y + h - ry + ry * k} ${x} ${y + h - ry}` +
            `V${y + ry}Z`;
            
  path.setAttribute('d', d);
  rect.parentNode.replaceChild(path, rect);
}

const paramCounts = {
  M: 2, m: 2,
  L: 2, l: 2,
  H: 1, h: 1,
  V: 1, v: 1,
  C: 6, c: 6,
  S: 4, s: 4,
  Q: 4, q: 4,
  T: 2, t: 2,
  A: 7, a: 7,
  Z: 0, z: 0
};

function normalizePath(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  let i = 0;
  let cx = 0, cy = 0;
  let startX = 0, startY = 0;
  let currentCmd = null;
  const result = [];
  
  while (i < tokens.length) {
    let token = tokens[i];
    if (/^[a-zA-Z]$/.test(token)) {
      currentCmd = token;
      i++;
    } else {
      if (!currentCmd) {
        i++;
        continue;
      }
    }
    
    if (currentCmd === 'Z' || currentCmd === 'z') {
      cx = startX; cy = startY;
      result.push('Z');
      continue;
    }
    
    const count = paramCounts[currentCmd];
    if (count === undefined) {
      continue;
    }
    
    const params = [];
    for (let k = 0; k < count; k++) {
      if (i < tokens.length) {
        params.push(Number(tokens[i++]));
      }
    }
    
    if (params.length < count) {
      break;
    }
    
    if (currentCmd === 'M') {
      cx = params[0]; cy = params[1];
      startX = cx; startY = cy;
      result.push(`M${cx} ${cy}`);
      currentCmd = 'L';
    } else if (currentCmd === 'm') {
      cx += params[0]; cy += params[1];
      startX = cx; startY = cy;
      result.push(`M${cx} ${cy}`);
      currentCmd = 'l';
    } else if (currentCmd === 'L') {
      cx = params[0]; cy = params[1];
      result.push(`L${cx} ${cy}`);
    } else if (currentCmd === 'l') {
      cx += params[0]; cy += params[1];
      result.push(`L${cx} ${cy}`);
    } else if (currentCmd === 'H') {
      cx = params[0];
      result.push(`L${cx} ${cy}`);
    } else if (currentCmd === 'h') {
      cx += params[0];
      result.push(`L${cx} ${cy}`);
    } else if (currentCmd === 'V') {
      cy = params[0];
      result.push(`L${cx} ${cy}`);
    } else if (currentCmd === 'v') {
      cy += params[0];
      result.push(`L${cx} ${cy}`);
    } else if (currentCmd === 'C') {
      const x1 = params[0], y1 = params[1];
      const x2 = params[2], y2 = params[3];
      cx = params[4]; cy = params[5];
      result.push(`C${x1} ${y1} ${x2} ${y2} ${cx} ${cy}`);
    } else if (currentCmd === 'c') {
      const x1 = cx + params[0], y1 = cy + params[1];
      const x2 = cx + params[2], y2 = cy + params[3];
      cx += params[4]; cy += params[5];
      result.push(`C${x1} ${y1} ${x2} ${y2} ${cx} ${cy}`);
    } else if (currentCmd === 'S') {
      const x2 = params[0], y2 = params[1];
      cx = params[2]; cy = params[3];
      result.push(`S${x2} ${y2} ${cx} ${cy}`);
    } else if (currentCmd === 's') {
      const x2 = cx + params[0], y2 = cy + params[1];
      cx += params[2]; cy += params[3];
      result.push(`S${x2} ${y2} ${cx} ${cy}`);
    } else if (currentCmd === 'Q') {
      const x1 = params[0], y1 = params[1];
      cx = params[2]; cy = params[3];
      result.push(`Q${x1} ${y1} ${cx} ${cy}`);
    } else if (currentCmd === 'q') {
      const x1 = cx + params[0], y1 = cy + params[1];
      cx += params[2]; cy += params[3];
      result.push(`Q${x1} ${y1} ${cx} ${cy}`);
    } else if (currentCmd === 'T') {
      cx = params[0]; cy = params[1];
      result.push(`T${cx} ${cy}`);
    } else if (currentCmd === 't') {
      cx += params[0]; cy += params[1];
      result.push(`T${cx} ${cy}`);
    } else if (currentCmd === 'A') {
      const rx = params[0], ry = params[1];
      const rot = params[2], laf = params[3], sf = params[4];
      cx = params[5]; cy = params[6];
      result.push(`A${rx} ${ry} ${rot} ${laf} ${sf} ${cx} ${cy}`);
    } else if (currentCmd === 'a') {
      const rx = params[0], ry = params[1];
      const rot = params[2], laf = params[3], sf = params[4];
      cx += params[5]; cy += params[6];
      result.push(`A${rx} ${ry} ${rot} ${laf} ${sf} ${cx} ${cy}`);
    }
  }
  return result.join('');
}

function mergeDuplicateFillAndStrokePaths(rootSvg) {
  const paths = Array.from(rootSvg.querySelectorAll('path'));
  const removed = new Set();
  for (let i = 0; i < paths.length; i++) {
    const p1 = paths[i];
    if (removed.has(p1)) continue;
    const b1 = getAbsoluteBounds(p1);
    if (!b1) continue;

    for (let j = i + 1; j < paths.length; j++) {
      const p2 = paths[j];
      if (removed.has(p2)) continue;
      if (p1.parentNode !== p2.parentNode) continue;

      const b2 = getAbsoluteBounds(p2);
      if (!b2) continue;

      // Check if bounds are almost identical (within 2 pixels)
      const dx = Math.abs(b1.x - b2.x);
      const dy = Math.abs(b1.y - b2.y);
      const dw = Math.abs(b1.width - b2.width);
      const dh = Math.abs(b1.height - b2.height);

      if (dx < 2.0 && dy < 2.0 && dw < 2.0 && dh < 2.0) {
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
        }
        else if (!hasFill1 && hasStroke1 && hasFill2 && !hasStroke2) {
          for (const attr of p1.getAttributeNames()) {
            if (attr.startsWith('stroke')) {
              p2.setAttribute(attr, p1.getAttribute(attr));
            }
          }
          p1.remove();
          removed.add(p1);
          break;
        }
      }
    }
  }
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(Number(value) || 0)));
}

function channelToHex(value) {
  return clampByte(value).toString(16).padStart(2, '0');
}

function layerColorKey(color) {
  if (!color) return null;
  return '#' + channelToHex((color.r || 0) * 255) + channelToHex((color.g || 0) * 255) + channelToHex((color.b || 0) * 255);
}

function svgColorKey(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text || text === 'none') return null;
  if (text === 'white') return '#ffffff';
  if (text === 'black') return '#000000';
  let m;
  if ((m = text.match(/^#[0-9a-f]{3}$/i))) {
    return '#' + m[0].slice(1).split('').map(ch => ch + ch).join('');
  }
  if ((m = text.match(/^#[0-9a-f]{6}$/i))) {
    return m[0];
  }
  if ((m = text.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i))) {
    return '#' + channelToHex(m[1]) + channelToHex(m[2]) + channelToHex(m[3]);
  }
  return text;
}

function layerPaintSignature(layer) {
  const fill = layer && layer.fills && layer.fills[0];
  if (!fill) return { kind: 'none', colors: [] };
  const type = String(fill.type || '').toUpperCase();
  if (type === 'SOLID') {
    return { kind: 'solid', colors: [layerColorKey(fill.color)] };
  }
  if (type.indexOf('GRADIENT_') === 0) {
    return {
      kind: 'gradient',
      colors: (fill.gradientStops || []).map(stop => layerColorKey(stop && stop.color)).filter(Boolean)
    };
  }
  return { kind: type.toLowerCase(), colors: [] };
}

function elementPaintSignature(el, rootSvg) {
  if (!el) return { kind: 'none', colors: [] };
  const fill = el.getAttribute('fill');
  if (!fill || fill === 'none') return { kind: 'none', colors: [] };
  const ref = String(fill).match(/^url\(#([^)]+)\)$/);
  if (ref && rootSvg) {
    const def = rootSvg.querySelector('#' + ref[1]);
    if (def) {
      const tag = String(def.tagName || '').toLowerCase();
      if (tag === 'lineargradient' || tag === 'radialgradient') {
        return {
          kind: 'gradient',
          colors: Array.from(def.querySelectorAll('stop')).map(stop => svgColorKey(stop.getAttribute('stop-color'))).filter(Boolean)
        };
      }
    }
  }
  return { kind: 'solid', colors: [svgColorKey(fill)] };
}

function colorPenalty(a, b) {
  if (!a || !b) return 24;
  if (a === b) return 0;
  const hex = /^#[0-9a-f]{6}$/i;
  if (!hex.test(a) || !hex.test(b)) return 32;
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  return (Math.abs(ar - br) + Math.abs(ag - bg) + Math.abs(ab - bb)) / 6;
}

function paintPenalty(el, layer, rootSvg) {
  const layerPaint = layerPaintSignature(layer);
  const elementPaint = elementPaintSignature(el, rootSvg);
  if (layerPaint.kind === 'none' || elementPaint.kind === 'none') return 0;
  let penalty = 0;
  if (layerPaint.kind !== elementPaint.kind) penalty += 120;
  penalty += Math.abs(layerPaint.colors.length - elementPaint.colors.length) * 8;
  const count = Math.min(layerPaint.colors.length, elementPaint.colors.length);
  if (count > 0) {
    penalty += colorPenalty(layerPaint.colors[0], elementPaint.colors[0]);
    if (count > 1) penalty += colorPenalty(layerPaint.colors[count - 1], elementPaint.colors[count - 1]);
  }
  return penalty;
}

function definitionPaintSignature(defNode) {
  if (!defNode) return null;
  const tag = String(defNode.tagName || '').toLowerCase();
  const attrs = Array.from(defNode.attributes || [])
    .filter(attr => attr.name !== 'id')
    .map(attr => `${attr.name}=${attr.value}`)
    .sort()
    .join('|');
  const stops = Array.from(defNode.querySelectorAll ? defNode.querySelectorAll('stop') : [])
    .map(stop => {
      const offset = stop.getAttribute('offset') || '';
      const color = svgColorKey(stop.getAttribute('stop-color')) || '';
      const opacity = stop.getAttribute('stop-opacity') || '';
      return `${offset}:${color}:${opacity}`;
    })
    .join('|');
  return `${tag}|${attrs}|${stops}`;
}

function normalizeEquivalentPaintRefsInTracks(tracks, rootSvg) {
  const refPattern = /^url\(#([^)]+)\)$/;
  const signatureCache = new Map();
  const signatureForRef = (value) => {
    const match = typeof value === 'string' && value.match(refPattern);
    if (!match) return null;
    const id = match[1];
    if (signatureCache.has(id)) return signatureCache.get(id);
    const defNode = rootSvg.querySelector('#' + id);
    const signature = definitionPaintSignature(defNode);
    signatureCache.set(id, signature);
    return signature;
  };

  tracks.forEach(track => {
    const canonicalByAttr = new Map();
    (track.colors || []).forEach(colorSet => {
      if (!colorSet) return;
      Object.entries(colorSet).forEach(([attrName, value]) => {
        const signature = signatureForRef(value);
        if (!signature) return;
        if (!canonicalByAttr.has(attrName)) canonicalByAttr.set(attrName, new Map());
        const bySignature = canonicalByAttr.get(attrName);
        if (!bySignature.has(signature)) bySignature.set(signature, value);
      });
    });
    (track.colors || []).forEach(colorSet => {
      if (!colorSet) return;
      Object.entries(colorSet).forEach(([attrName, value]) => {
        const signature = signatureForRef(value);
        if (!signature) return;
        const canonical = canonicalByAttr.get(attrName) && canonicalByAttr.get(attrName).get(signature);
        if (canonical) colorSet[attrName] = canonical;
      });
    });
  });
}

function matchGeometryGloballyV2(state) {
  const doc = new DOMParser().parseFromString(state.svg, 'image/svg+xml');
  const rootSvg = doc.documentElement;
  const originalIds = new Map();
  rootSvg.querySelectorAll('[data-motion-id]').forEach(el => {
    originalIds.set(el.getAttribute('data-motion-id'), el);
  });

  // Convert all rect elements to paths to avoid tag mismatch in buildTrack
  rootSvg.querySelectorAll('rect').forEach(rect => {
    let parent = rect.parentNode;
    let isInsideDefs = false;
    while (parent) {
      if (parent.tagName && parent.tagName.toLowerCase() === 'defs') {
        isInsideDefs = true;
        break;
      }
      parent = parent.parentNode;
    }
    if (!isInsideDefs) {
      convertRectToPath(rect);
    }
  });

  // Normalize all paths in the SVG to absolute M, L, C commands to ensure compatibility
  rootSvg.querySelectorAll('path').forEach(path => {
    const d = path.getAttribute('d');
    if (d) {
      path.setAttribute('d', normalizePath(d));
    }
  });

  mergeDuplicateFillAndStrokePaths(rootSvg);

  // Container grouping logic removed because containers are matched robustly via fallback

  rootSvg.querySelectorAll('[data-motion-id]').forEach(el => el.removeAttribute('data-motion-id'));

  const matchedNodes = new Map();
  const scene = rootSvg.querySelector('#motion-scene') || rootSvg;
  const extractPath = (id) => {
    if (!id) return null;
    const split = id.indexOf(':@root');
    return split < 0 ? id : id.slice(split + 1);
  };

  const rootLayer = state.layers.find(l => extractPath(l.stableNodeId) === '@root');
  if (rootLayer) {
    matchedNodes.set(rootLayer.stableNodeId, scene);
    scene.setAttribute('data-motion-id', rootLayer.stableNodeId);
  }
  const shouldUsePaintTieBreaker = (layer) => {
    const bounds = layer && layer.bounds;
    if (!layer || !bounds || !rootLayer) return false;
    if (layer.type !== 'RECTANGLE') return false;
    if (layer.parentStableNodeId !== rootLayer.stableNodeId) return false;
    if (bounds.height > 24) return false;
    return bounds.y >= Number(state.height || 0) - 80;
  };

  const containerLayers = state.layers.filter(l => ['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET'].includes(l.type) && l.stableNodeId !== rootLayer.stableNodeId);
  const leafLayers = state.layers.filter(l => !['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET'].includes(l.type));

  const svgElements = [];
  const collect = (node) => {
    const tag = node.tagName.toLowerCase();
    if (['rect', 'circle', 'ellipse', 'path', 'text', 'g'].includes(tag)) {
      svgElements.push(node);
    }
    Array.from(node.children).forEach(collect);
  };
  collect(rootSvg);

  const matchedElementsSet = new Set();
  matchedElementsSet.add(scene);
  if (scene.tagName.toLowerCase() === 'svg') {
    Array.from(scene.children).forEach(child => {
      if (child.tagName.toLowerCase() === 'g' && !child.hasAttribute('data-motion-id')) {
        matchedElementsSet.add(child);
      }
    });
  }

  // Pass 1: Match exact bounds
  leafLayers.forEach(layer => {
    let bestMatch = null;
    let bestScore = Infinity;

    svgElements.forEach(el => {
      if (matchedElementsSet.has(el)) return;
      if (el.tagName.toLowerCase() === 'g') return;
      if (!isTagCompatible(el.tagName, layer.type)) return;

      const bSVG = getAbsoluteBounds(el);
      if (!bSVG) return;

      const bLayer = layer.bounds;
      const dx = Math.abs(bSVG.x - bLayer.x);
      const dy = Math.abs(bSVG.y - bLayer.y);
      const dw = Math.abs(bSVG.width - bLayer.width);
      const dh = Math.abs(bSVG.height - bLayer.height);

      const diff = dx + dy + dw + dh;
      const boundsMatch = dx < 2.5 && dy < 2.5 && dw < 2.5 && dh < 2.5;

      if (boundsMatch) {
        const score = diff + (shouldUsePaintTieBreaker(layer) ? paintPenalty(el, layer, rootSvg) : 0);
        if (score < bestScore) {
          bestScore = score;
          bestMatch = el;
        }
      }
    });

    if (bestMatch) {
      matchedNodes.set(layer.stableNodeId, bestMatch);
      matchedElementsSet.add(bestMatch);
      bestMatch.setAttribute('data-motion-id', layer.stableNodeId);
    }
  });

  // Pass 2: Match loose bounds (isInside) for remaining unmatched layers
  leafLayers.forEach(layer => {
    if (matchedNodes.has(layer.stableNodeId)) return; // Already matched in Pass 1

    let bestMatch = null;
    let bestScore = Infinity;

    svgElements.forEach(el => {
      if (matchedElementsSet.has(el)) return;
      if (el.tagName.toLowerCase() === 'g') return;
      if (!isTagCompatible(el.tagName, layer.type)) return;

      const bSVG = getAbsoluteBounds(el);
      if (!bSVG) return;

      const bLayer = layer.bounds;
      const dx = Math.abs(bSVG.x - bLayer.x);
      const dy = Math.abs(bSVG.y - bLayer.y);
      const dw = Math.abs(bSVG.width - bLayer.width);
      const dh = Math.abs(bSVG.height - bLayer.height);

      const diff = dx + dy + dw + dh;

      const isInside = bSVG.x >= bLayer.x - 3.5 && 
                       bSVG.y >= bLayer.y - 3.5 && 
                       bSVG.x + bSVG.width <= bLayer.x + bLayer.width + 3.5 && 
                       bSVG.y + bSVG.height <= bLayer.y + bLayer.height + 3.5;

      if (isInside && (layer.name.toLowerCase().includes('yellow') || layer.name.toLowerCase().includes('cyan') || layer.name.toLowerCase().includes('blue') || layer.name.toLowerCase().includes('orange') || layer.type === 'ELLIPSE' || layer.type === 'TEXT')) {
        const score = diff + (shouldUsePaintTieBreaker(layer) ? paintPenalty(el, layer, rootSvg) : 0);
        if (score < bestScore) {
          bestScore = score;
          bestMatch = el;
        }
      }
    });

    if (bestMatch) {
      matchedNodes.set(layer.stableNodeId, bestMatch);
      matchedElementsSet.add(bestMatch);
      bestMatch.setAttribute('data-motion-id', layer.stableNodeId);
    }
  });

  const sortedContainers = [...containerLayers].sort((a, b) => {
    return extractPath(b.stableNodeId).split('/').length - extractPath(a.stableNodeId).split('/').length;
  });

  sortedContainers.forEach(layer => {
    const children = state.layers.filter(l => l.parentStableNodeId === layer.stableNodeId);
    const matchedChildEls = children
      .map(c => matchedNodes.get(c.stableNodeId))
      .filter(Boolean);
    
    let matchedGroup = null;
    if (matchedChildEls.length > 0) {
      const firstChildEl = matchedChildEls[0];
      const candidates = [];
      let current = firstChildEl.parentNode;
      while (current && current.tagName && current.tagName.toLowerCase() !== 'svg') {
        if (current.tagName.toLowerCase() === 'g' && !matchedElementsSet.has(current)) {
          const containsAll = matchedChildEls.every(childEl => current.contains(childEl));
          if (containsAll) {
            candidates.push(current);
          }
        }
        current = current.parentNode;
      }

      if (candidates.length > 0) {
        let bestMatch = candidates[0];
        let minDiff = Infinity;
        candidates.forEach(cand => {
          const bSVG = getAbsoluteBounds(cand);
          if (!bSVG) return;
          const bLayer = layer.bounds;
          const dx = Math.abs(bSVG.x - bLayer.x);
          const dy = Math.abs(bSVG.y - bLayer.y);
          const dw = Math.abs(bSVG.width - bLayer.width);
          const dh = Math.abs(bSVG.height - bLayer.height);
          const diff = dx + dy + dw + dh;
          if (diff < minDiff - 0.1) {
            minDiff = diff;
            bestMatch = cand;
          } else if (Math.abs(diff - minDiff) <= 0.1) {
            bestMatch = cand;
          }
        });
        matchedGroup = bestMatch;
      }
    }

    if (matchedGroup) {
      matchedNodes.set(layer.stableNodeId, matchedGroup);
      matchedElementsSet.add(matchedGroup);
      matchedGroup.setAttribute('data-motion-id', layer.stableNodeId);
      // Match child layers (e.g., badge text) inside this group
      const childLayers = state.layers.filter(l => l.parentStableNodeId === layer.stableNodeId);
      childLayers.forEach(childLayer => {
        if (matchedNodes.has(childLayer.stableNodeId)) return;
        const candidates = Array.from(matchedGroup.querySelectorAll('*')).filter(el => !matchedElementsSet.has(el));
        let best = null;
        let bestScore = Infinity;
        candidates.forEach(el => {
          if (!isTagCompatible(el.tagName, childLayer.type)) return;
          const bSVG = getAbsoluteBounds(el);
          const bLayer = childLayer.bounds;
          if (!bSVG || !bLayer) return;
          const diff = Math.abs(bSVG.x - bLayer.x) + Math.abs(bSVG.y - bLayer.y) +
                     Math.abs(bSVG.width - bLayer.width) + Math.abs(bSVG.height - bLayer.height);
          if (diff < bestScore) {
            bestScore = diff;
            best = el;
          }
        });
        if (best) {
          matchedNodes.set(childLayer.stableNodeId, best);
          matchedElementsSet.add(best);
          best.setAttribute('data-motion-id', childLayer.stableNodeId);
        }
      });
    } else {
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
  });

  const cid = '1:4181:@root/container[0]';
  const orig = originalIds.get(cid);
  const matched = matchedNodes.get(cid);
  console.log('State:', state.name || state.id, 'origEl tag =', orig ? orig.tagName : 'null', 'matchedNode tag =', matched ? matched.tagName : 'null', 'in matchedElementsSet =', matched ? matchedElementsSet.has(matched) : 'false');
  return new XMLSerializer().serializeToString(rootSvg);
}

function buildStateMapping(state) {
  const allPaths = new Set();
  const extractPath = (id) => {
    if (!id) return null;
    const split = id.indexOf(':@root');
    if (split < 0) return null;
    return id.slice(split + 1);
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

  // Map parent path -> Set of child names
  const childNamesMap = new Map();
  pathList.forEach(path => {
    const lastSlash = path.lastIndexOf('/');
    if (lastSlash >= 0) {
      const parent = path.slice(0, lastSlash);
      const child = path.slice(lastSlash + 1);
      if (!childNamesMap.has(parent)) {
        childNamesMap.set(parent, new Set());
      }
      const bracket = child.indexOf('[');
      const namePart = bracket >= 0 ? child.slice(0, bracket) : child;
      const baseChildName = namePart.replace(/_\d+$/, '').toLowerCase();
      childNamesMap.get(parent).add(baseChildName);
    }
  });

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
  const counters = new Map();

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

    const bracketIndex = segment.indexOf('[');
    if (bracketIndex < 0) {
      mapping.set(path, canonicalParent + '/' + segment);
      return;
    }

    const namePart = segment.slice(0, bracketIndex);
    const origIndexStr = segment.slice(bracketIndex + 1, segment.length - 1);
    const origIndex = parseInt(origIndexStr, 10);

    let baseName = namePart;
    let suffix = null;
    const suffixMatch = namePart.match(/^(.*)_(\d+)$/);
    if (suffixMatch) {
      baseName = suffixMatch[1];
      suffix = parseInt(suffixMatch[2], 10);
    }

    // Semantic naming for mask-group based on its children
    if (baseName.toLowerCase().startsWith('mask-group')) {
      const children = childNamesMap.get(path) || new Set();
      if (children.has('yellow')) baseName = 'mask-group-yellow';
      else if (children.has('cyan')) baseName = 'mask-group-cyan';
      else if (children.has('blue')) baseName = 'mask-group-blue';
      else if (children.has('orange')) baseName = 'mask-group-orange';
    }

    const key = canonicalParent + '|' + baseName;
    const count = counters.get(key) || 0;
    counters.set(key, count + 1);

    const canonicalSegment = baseName + '[' + count + ']';
    mapping.set(path, canonicalParent + '/' + canonicalSegment);
  });

  return mapping;
}

function mapId(id, mapping) {
  if (!id) return id;
  const split = id.indexOf(':@root');
  if (split < 0) return id;
  const prefix = id.slice(0, split);
  const path = id.slice(split + 1);
  const canonicalPath = mapping.get(path) || path;
  return prefix + ':' + canonicalPath;
}

function mapPath(pathStr, mapping) {
  if (!pathStr) return pathStr;
  return mapping.get(pathStr) || pathStr;
}

function canonicalizeManifest(manifest){
  const seenIds = new Set();
  const uniqueStates = [];
  for (const s of (manifest.states || [])) {
    if (!seenIds.has(s.id)) {
      seenIds.add(s.id);
      uniqueStates.push(s);
    }
  }
  manifest.states = uniqueStates;

  if (manifest.prototype && Array.isArray(manifest.prototype.reactions)) {
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
  }

  const states=(manifest.states||[]).map((state, stateIdx)=>{
    const correctedSvg = matchGeometryGloballyV2(state);
    const stateWithGeom = Object.assign({}, state, { svg: correctedSvg });
    
    const doc = new DOMParser().parseFromString(stateWithGeom.svg, 'image/svg+xml');
    const rootSvg = doc.documentElement;
    const defsRoot = rootSvg.querySelector('defs');
    const defElements = defsRoot ? Array.from(defsRoot.children).filter(el => el.getAttribute('id')) : [];
    const idMap = new Map();
    const collectedDefs = [];

    defElements.forEach(el => {
      const tag = el.tagName.toLowerCase();
      if (tag === 'filter') {
        el.removeAttribute('x');
        el.removeAttribute('y');
        el.removeAttribute('width');
        el.removeAttribute('height');
      } else if (tag === 'lineargradient' || tag === 'radialgradient') {
        el.querySelectorAll('stop').forEach((stop, stopIdx) => {
          const offset = stop.getAttribute('offset');
          if (offset === null || offset === 'null') {
            stop.setAttribute('offset', stopIdx === 0 ? '0' : '1');
          }
        });
      }
      const oldId = el.getAttribute('id');
      if (oldId) {
        const newId = oldId + '_state' + stateIdx;
        idMap.set(oldId, newId);
        el.setAttribute('id', newId);
      }
    });

    if (idMap.size > 0) {
      const allElements = rootSvg.querySelectorAll('*');
      allElements.forEach(el => {
        ['fill', 'stroke', 'filter', 'clip-path', 'mask'].forEach(attr => {
          if (el.hasAttribute(attr)) {
            let val = el.getAttribute(attr);
            idMap.forEach((newId, oldId) => {
              const regex = new RegExp('url\\(\\s*[\'"]?#' + oldId + '[\'"]?\\s*\\)', 'g');
              val = val.replace(regex, 'url(#' + newId + ')');
            });
            el.setAttribute(attr, val);
          }
        });
        ['href', 'xlink:href'].forEach(attr => {
          if (el.hasAttribute(attr)) {
            let val = el.getAttribute(attr);
            if (val.startsWith('#')) {
              const oldId = val.slice(1);
              if (idMap.has(oldId)) {
                el.setAttribute(attr, '#' + idMap.get(oldId));
              }
            }
          }
        });
      });
    }

    defElements.forEach(el => {
      collectedDefs.push(el.cloneNode(true));
    });

    stateWithGeom.svg = new XMLSerializer().serializeToString(rootSvg);
    stateWithGeom.collectedDefs = collectedDefs;

    const mapping = buildStateMapping(stateWithGeom);
    
    const layers=(stateWithGeom.layers||[]).map(layer=>Object.assign({},layer,{
      stableNodeId: mapId(layer.stableNodeId, mapping),
      parentStableNodeId: layer.parentStableNodeId ? mapId(layer.parentStableNodeId, mapping) : null,
      semanticPath: mapPath(layer.semanticPath, mapping),
      structuralSlot: mapPath(layer.structuralSlot, mapping)
    }));

    const seen=new Set();
    const svgNodeMap=(stateWithGeom.svgNodeMap||[]).filter(entry=>String(entry.tag||'').toLowerCase()!=='g').map(entry=>Object.assign({},entry,{
      stableNodeId: mapId(entry.stableNodeId, mapping),
      parentStableNodeId: entry.parentStableNodeId ? mapId(entry.parentStableNodeId, mapping) : null
    })).filter(entry=>{
      const key=entry.stableNodeId+'|'+entry.tag;
      if(seen.has(key))return false;
      seen.add(key);
      return true;
    });

    let svg = stateWithGeom.svg;
    if (typeof svg === 'string') {
      const doc2 = new DOMParser().parseFromString(svg, 'image/svg+xml');
      doc2.querySelectorAll('[data-motion-id]').forEach(el => {
        const origId = el.getAttribute('data-motion-id');
        const canonicalId = mapId(origId, mapping);
        el.setAttribute('data-motion-id', canonicalId);
      });
      svg = new XMLSerializer().serializeToString(doc2.documentElement);
    }

    return Object.assign({},stateWithGeom,{layers,svgNodeMap,svg});
  });
  return Object.assign({},manifest,{states});
}

function parseState(state){const doc=new DOMParser().parseFromString(state.svg,'image/svg+xml'),error=doc.querySelector('parsererror');if(error)throw new Error('SVG không hợp lệ ở '+(state.name||state.id)+': '+error.textContent.slice(0,160));const svg=doc.documentElement;const map=new Map();svg.querySelectorAll('[data-motion-id]').forEach(el=>{const id=el.getAttribute('data-motion-id');if(!map.has(id))map.set(id,el)});return{state,doc,svg,map}}
function layerMap(state){const out=new Map();(state.layers||[]).forEach(layer=>out.set(layer.stableNodeId,layer));return out}
function numAttrs(el){const out={};NUMERIC.forEach(name=>{if(el&&el.hasAttribute(name)){const value=Number(el.getAttribute(name));if(Number.isFinite(value))out[name]=value}});return out}
function parseColor(value){const v=String(value||'').trim();let m;if(/^#[0-9a-f]{6}$/i.test(v))return[v.slice(1,3),v.slice(3,5),v.slice(5,7)].map(x=>parseInt(x,16));if((m=v.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i)))return m.slice(1).map(Number);return null}
function colorAttrs(el){const out={};COLOR.forEach(name=>{if(!el||!el.hasAttribute(name))return;const val=el.getAttribute(name);const parsed=parseColor(val);if(parsed)out[name]=parsed;else out[name]=val});return out}
function tokenizePath(d){return String(d||'').match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g)||[]}
function pathTemplate(d){const tokens=tokenizePath(d),commands=tokens.filter(x=>/^[a-zA-Z]$/.test(x)),numbers=tokens.filter(x=>!/^[a-zA-Z]$/.test(x)).map(Number);return{tokens,commands:commands.join(''),numbers}}
function compatiblePaths(paths){const valid=paths.filter(Boolean);if(valid.length<2)return false;const first=pathTemplate(valid[0]);return valid.every(path=>{const next=pathTemplate(path);return next.commands===first.commands&&next.numbers.length===first.numbers.length})}
function parseTransformMatrix(value){return parseTransform(value)}
function layerRotation(layer){if(!layer)return null;const b=layer.bounds||{};return{angle:Number(layer.rotation)||0,cx:(Number(b.x)||0)+(Number(b.width)||0)/2,cy:(Number(b.y)||0)+(Number(b.height)||0)/2}}

function stripPrefix(id) {
  if (!id) return '';
  const idx = id.indexOf('@root');
  return idx >= 0 ? id.substring(idx) : id;
}

function getDomParentLayer(layer, state, node) {
  if (!node) return null;
  let parent = node.parentNode;
  while (parent && parent.tagName && parent.tagName.toLowerCase() !== 'svg') {
    if (parent.getAttribute && parent.getAttribute('data-motion-id')) {
      const parentId = parent.getAttribute('data-motion-id');
      const parentLayer = state.layers.find(l => stripPrefix(l.stableNodeId) === stripPrefix(parentId));
      if (parentLayer) return parentLayer;
    }
    parent = parent.parentNode;
  }
  return null;
}

function getLayerParent(layer, state) {
  if (!layer || !layer.parentStableNodeId) return null;
  return state.layers.find(l => stripPrefix(l.stableNodeId) === stripPrefix(layer.parentStableNodeId));
}

function isLayerGloballyVisible(layer, state) {
  let curr = layer;
  while (curr) {
    if (curr.visible === false) return false;
    if (!curr.parentStableNodeId) break;
    curr = state.layers.find(l => stripPrefix(l.stableNodeId) === stripPrefix(curr.parentStableNodeId));
  }
  return true;
}

function buildTrack(id,nodes,layers,states){
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
  });
  const actualBaseIndex = nodes.map(Boolean).indexOf(true);
  const base = nodes[actualBaseIndex];
  if(!base)return null;

  const tags=nodes.filter(Boolean).map(n=>String(n.tagName).toLowerCase()),sameTag=tags.every(tag=>tag===tags[0]);
  const numeric=nodes.map(numAttrs);
  
  // Fill in default values for missing keys in states where the node is present
  const definedKeys = new Set();
  numeric.forEach(obj => {
    if (obj) {
      Object.keys(obj).forEach(k => definedKeys.add(k));
    }
  });
  
  const SVG_DEFAULTS = {
    'opacity': 1,
    'fill-opacity': 1,
    'stroke-opacity': 1,
    'stroke-width': 1,
    'stroke-dashoffset': 0,
    'rx': 0,
    'ry': 0,
    'x': 0,
    'y': 0,
    'x1': 0,
    'y1': 0,
    'x2': 0,
    'y2': 0,
    'cx': 0,
    'cy': 0,
    'r': 0,
    'width': 0,
    'height': 0
  };
  
  // If an active bar layer is empty/inactive (height/width <= 1.01), force opacity to 0
  // to avoid rendering residual strokes/rounded corner lines.
  layers.forEach((layer, idx) => {
    if (layer && layer.bounds && layer.name && layer.name.toLowerCase().includes('active')) {
      const isTinyBar = (layer.bounds.height <= 1.01 || layer.bounds.width <= 1.01);
      if (isTinyBar) {
        if (!numeric[idx]) numeric[idx] = {};
        numeric[idx]['opacity'] = 0;
        definedKeys.add('opacity');
      }
    }
  });
  
  nodes.forEach((n, idx) => {
    if (n) {
      definedKeys.forEach(key => {
        if (numeric[idx][key] === undefined && SVG_DEFAULTS[key] !== undefined) {
          numeric[idx][key] = SVG_DEFAULTS[key];
        }
      });
    }
  });

  const colors=nodes.map(colorAttrs);
  const paths=nodes.map(n=>n&&n.getAttribute('d')||null);
  
  const baseTransform = base.getAttribute('transform') ? parseTransform(base.getAttribute('transform')) : [1, 0, 0, 1, 0, 0];

  const transforms = nodes.map((n, idx) => {
    if (n) {
      return parseTransform(n.getAttribute('transform'));
    }
    const baseLayer = layers[actualBaseIndex];
    const targetLayer = layers[idx];
    if (baseLayer && targetLayer && baseLayer.bounds && targetLayer.bounds) {
      const sw = targetLayer.bounds.width / (baseLayer.bounds.width || 0.001);
      const sh = targetLayer.bounds.height / (baseLayer.bounds.height || 0.001);
      
      const baseState = states[actualBaseIndex].state;
      const baseParent = getDomParentLayer(baseLayer, baseState, base);
      
      let baseParentX = 0, baseParentY = 0;
      let targetParentX = 0, targetParentY = 0;
      
      if (baseParent) {
        baseParentX = baseParent.bounds.x;
        baseParentY = baseParent.bounds.y;
        
        const targetParent = states[idx].state.layers.find(l => stripPrefix(l.stableNodeId) === stripPrefix(baseParent.stableNodeId));
        if (targetParent && targetParent.bounds) {
          targetParentX = targetParent.bounds.x;
          targetParentY = targetParent.bounds.y;
        }
      }
      
      const relativeBaseX = baseLayer.bounds.x - baseParentX;
      const relativeBaseY = baseLayer.bounds.y - baseParentY;
      const relativeTargetX = targetLayer.bounds.x - targetParentX;
      const relativeTargetY = targetLayer.bounds.y - targetParentY;
      
      const tx = relativeTargetX - sw * relativeBaseX;
      const ty = relativeTargetY - sh * relativeBaseY;
      
      const a = baseTransform[0], b = baseTransform[1], c = baseTransform[2], d = baseTransform[3], e = baseTransform[4], f = baseTransform[5];
      return [
        sw * a,
        sw * b,
        sh * c,
        sh * d,
        sw * e + tx,
        sh * f + ty
      ];
    }
    return null;
  });

  const rotations=layers.map(layerRotation);
  let pathMode=false;
  if(sameTag&&tags[0]==='path'&&compatiblePaths(paths))pathMode=true;

  const zOrder = states.map((s, idx) => {
    const layer = layers[idx];
    if (layer) {
      return s.state.layers.findIndex(l => stripPrefix(l.stableNodeId) === stripPrefix(id));
    }
    const baseLayer = layers[actualBaseIndex];
    if (baseLayer) {
      const baseState = states[actualBaseIndex].state;
      const baseParent = getLayerParent(baseLayer, baseState);
      if (baseParent) {
        const parentId = baseParent.stableNodeId;
        const targetParentIdx = s.state.layers.findIndex(l => stripPrefix(l.stableNodeId) === stripPrefix(parentId));
        if (targetParentIdx >= 0) {
          return targetParentIdx;
        }
      }
    }
    return 0;
  });

  // hasDomNode: true if the base-state node is a real SVG element (not synthetic/off-screen).
  // Used by normalizeNestedTrackTransforms to skip normalization against purely synthetic ancestors.
  const hasDomNode = nodes[actualBaseIndex] !== null;

  return{id,baseIndex:actualBaseIndex,hasDomNode,tag:String(base.tagName).toLowerCase(),present,numeric,colors,paths,pathMode,transforms,rotations,zOrder}
}

function cloneMissingTracks(scene,tracks,states){
  const getDomDepth = (node) => {
    let depth = 0;
    let curr = node;
    while (curr && curr.parentNode) {
      depth++;
      curr = curr.parentNode;
    }
    return depth;
  };

  const sortedTracks = [...tracks].map(track => {
    const source = track.baseIndex !== 0 ? states[track.baseIndex].map.get(track.id) : null;
    return { track, source, depth: source ? getDomDepth(source) : 9999 };
  }).sort((a, b) => a.depth - b.depth);

  sortedTracks.forEach(({ track, source }) => {
    if(track.baseIndex===0)return;
    if (scene.querySelector('[data-motion-id="' + CSS.escape(track.id) + '"]')) {
      return;
    }
    if(!source)return;
    const clone=source.cloneNode(true);
    clone.setAttribute('data-motion-id',track.id);
    if (!track.present[0]) {
      clone.setAttribute('opacity','0');
    }
    
    let parentNode = source.parentNode;
    let targetParent = null;
    while (parentNode && parentNode.parentNode && parentNode.tagName && parentNode.tagName.toLowerCase() !== 'svg') {
      if (parentNode.getAttribute && parentNode.getAttribute('data-motion-id')) {
        const parentId = parentNode.getAttribute('data-motion-id');
        targetParent = scene.querySelector('[data-motion-id="' + CSS.escape(parentId) + '"]');
        if (targetParent) break;
      }
      parentNode = parentNode.parentNode;
    }
    
    if (targetParent) {
      targetParent.appendChild(clone);
    } else {
      scene.appendChild(clone);
    }
  });
}

function multiplyAffine(a, b) {
  if (!a || !b) return null;
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5]
  ];
}

function invertAffine(matrix) {
  if (!matrix) return null;
  const det = matrix[0] * matrix[3] - matrix[1] * matrix[2];
  if (!Number.isFinite(det) || Math.abs(det) < 1e-9) return null;
  return [
    matrix[3] / det,
    -matrix[1] / det,
    -matrix[2] / det,
    matrix[0] / det,
    (matrix[2] * matrix[5] - matrix[3] * matrix[4]) / det,
    (matrix[1] * matrix[4] - matrix[0] * matrix[5]) / det
  ];
}

function nearestTrackedAncestorId(id, ids) {
  let current = String(id || '');
  while (current.includes('/')) {
    current = current.slice(0, current.lastIndexOf('/'));
    if (ids.has(current)) return current;
  }
  return null;
}

function normalizeNestedTrackTransforms(tracks) {
  const byId = new Map(tracks.map(track => [track.id, track]));
  const ids = new Set(byId.keys());
  tracks.forEach(track => {
    // Walk up the ID path to find the nearest ancestor track.
    let current = String(track.id);
    let ancestor = null;
    while (current.includes('/')) {
      current = current.slice(0, current.lastIndexOf('/'));
      if (!ids.has(current)) continue;
      const candidate = byId.get(current);
      if (candidate && candidate.transforms) {
        ancestor = candidate;
        break;
      }
    }
    if (!ancestor) return;

    // SVG element transforms (from parseTransform on DOM nodes) are already LOCAL to their
    // parent element — they do NOT need to be further relativized.
    // Synthetic transforms (computed from manifest bounds for off-screen elements) are also
    // computed relative to the DOM parent via getDomParentLayer.
    // Therefore: if the ancestor has a real DOM node (hasDomNode=true), its transform is
    // already local SVG space and we must NOT normalize the child against it — doing so
    // would subtract the ancestor's local offset from the child's already-local offset,
    // producing a double-relative (and therefore wrong) result.
    //
    // Normalization IS needed only when the ancestor has transforms in ABSOLUTE screen space —
    // which historically happened for elements matched to clip-path groups that were positioned
    // globally. With the current synthetic-transform calculation (always using parent-relative
    // bounds), this case no longer occurs.
    //
    // Skip normalization when the ancestor has a real DOM element.
    if (ancestor.hasDomNode) return;

    track.transforms = track.transforms.map((matrix, index) => {
      const parentMatrix = ancestor.transforms[index];
      if (!matrix || !parentMatrix) return matrix;
      const parentInverse = invertAffine(parentMatrix);
      if (!parentInverse) return matrix;
      return multiplyAffine(parentInverse, matrix);
    });
  });
}


function runtime(data){
  const json=JSON.stringify(data).replace(/</g,'\\u003c');
  if(!data.wrapperAwareZOrder&&!data.referencedColorInterpolation)return"(()=>{const D="+json+",svg=(document.currentScript&&(document.currentScript.closest('svg')||document.currentScript.ownerDocument.querySelector('#motion-svg')||document.currentScript.ownerDocument.documentElement))||document.querySelector('#motion-svg')||document.documentElement,scene=svg.querySelector('#motion-scene');let start=performance.now(),manual=false,paused=false;const C=v=>Math.max(0,Math.min(1,v)),L=(a,b,p)=>(Number(a)||0)+((Number(b)||0)-(Number(a)||0))*p,E=p=>p*p*(3-2*p),pick=(arr,i)=>arr[i]!=null?arr[i]:arr.slice(0,i).reverse().find(v=>v!=null)??arr.find(v=>v!=null);function state(t){let active=0,segment=null;for(const s of D.segments){if(t<s.start){active=s.from;break}active=s.to;if(t>=s.start&&t<s.end){segment=s;break}}return{active,segment}}function color(a,b,p){if(typeof a==='string'||typeof b==='string')return p<0.5?a:b;return'rgb('+[0,1,2].map(i=>Math.round(L(a[i],b[i],p))).join(',')+')'}function path(track,from,to,p){const a=pick(track.paths,from),b=pick(track.paths,to);if(!a||!b)return null;const ta=a.match(/[a-zA-Z]|-?\\d*\\.?\\d+(?:e[-+]?\\d+)?/g)||[],tb=b.match(/[a-zA-Z]|-?\\d*\\.?\\d+(?:e[-+]?\\d+)?/g)||[];let ni=0;return ta.map((token,index)=>/^[a-zA-Z]$/.test(token)?token:String(L(Number(token),Number(tb[index]),p))).join(' ')}function render(t){const total=Math.max(.001,D.duration);t=D.infinite?((t%total)+total)%total:C(t/total)*total;const q=state(t),p=q.segment?E(C((t-q.segment.start)/Math.max(.001,q.segment.end-q.segment.start))):0,from=q.segment?q.segment.from:q.active,to=q.segment?q.segment.to:q.active;for(const tr of D.tracks){const el=scene.querySelector('[data-motion-id=\"'+CSS.escape(tr.id)+'\"]');if(!el)continue;if(el.hasAttribute('data-refresh-rotor')||el.hasAttribute('data-exact-ring')||el.getAttribute('data-static-connector')==='true')continue;const parent=el.parentNode;if(parent&&parent.closest&&parent.closest('[data-refresh-rotor],[data-exact-ring]'))continue;const pa=tr.present[from],pb=tr.present[to];if(!pa&&!pb){el.setAttribute('visibility','hidden');continue}el.setAttribute('visibility','visible');const na=pick(tr.numeric,from)||{},nb=pick(tr.numeric,to)||{};for(const name of D.numeric){if(na[name]!=null||nb[name]!=null)el.setAttribute(name,String(L(na[name],nb[name],p)))}const ca=pick(tr.colors,from)||{},cb=pick(tr.colors,to)||{};for(const name of D.colors){if(ca[name]&&cb[name])el.setAttribute(name,color(ca[name],cb[name],p))}if(tr.pathMode){const d=path(tr,from,to,p);if(d)el.setAttribute('d',d)}else if(tr.paths){const d=p<0.5?pick(tr.paths,from):pick(tr.paths,to);if(d)el.setAttribute('d',d)}const ma=pick(tr.transforms,from),mb=pick(tr.transforms,to);if(ma&&mb)el.setAttribute('transform','matrix('+ma.map((v,i)=>L(v,mb[i],p)).join(' ')+')');const ra=pick(tr.rotations,from),rb=pick(tr.rotations,to);if(ra&&rb){let a=ra.angle,b=rb.angle;while(b-a>180)b-=360;while(a-b>180)b+=360;el.setAttribute('transform','rotate('+L(a,b,p)+' '+L(ra.cx,rb.cx,p)+' '+L(ra.cy,rb.cy,p)+')')}if(pa&&!pb)el.setAttribute('opacity',String(1-p));else if(!pa&&pb)el.setAttribute('opacity',String(p));else if(pa&&pb){const opa=na['opacity']!=null?L(na['opacity'],nb['opacity'],p):1;el.setAttribute('opacity',String(opa))}}const sorted=[];for(const tr of D.tracks){if(tr.zOrder){const el=scene.querySelector('[data-motion-id=\"'+CSS.escape(tr.id)+'\"]');if(el){if(el.parentNode!==scene)continue;const parent=el.parentNode;if(parent&&parent.closest&&parent.closest('[data-refresh-rotor],[data-exact-ring]'))continue;const za=pick(tr.zOrder,from),zb=pick(tr.zOrder,to);sorted.push({el,z:L(za,zb,p)})}}}const exactRing=scene.querySelector('[data-exact-ring]');if(exactRing){const connIdx=sorted.findIndex(item=>{const mid=item.el.getAttribute('data-motion-id');return(mid&&mid.includes('vector-1[0]'))||item.el.getAttribute('data-static-connector')==='true'});if(connIdx>=0){sorted.push({el:exactRing,z:sorted[connIdx].z-0.5})}else{sorted.push({el:exactRing,z:20})}}sorted.sort((a,b)=>a.z-b.z);for(const item of sorted)scene.appendChild(item.el)}function tick(now){if(!manual&&!paused)render((now-start)/1000);requestAnimationFrame(tick)}svg.__motionController={seek(t){manual=true;render(Number(t)||0)},play(){manual=false;paused=false;start=performance.now()},pause(){paused=true},restart(){manual=false;paused=false;start=performance.now();render(0)}};render(0);requestAnimationFrame(tick)})()";
  if(!data.wrapperAwareZOrder)return"(()=>{const D="+json+",svg=(document.currentScript&&(document.currentScript.closest('svg')||document.currentScript.ownerDocument.querySelector('#motion-svg')||document.currentScript.ownerDocument.documentElement))||document.querySelector('#motion-svg')||document.documentElement,scene=svg.querySelector('#motion-scene');let start=performance.now(),manual=false,paused=false;const C=v=>Math.max(0,Math.min(1,v)),L=(a,b,p)=>(Number(a)||0)+((Number(b)||0)-(Number(a)||0))*p,E=p=>p*p*(3-2*p),pick=(arr,i)=>arr[i]!=null?arr[i]:arr.slice(0,i).reverse().find(v=>v!=null)??arr.find(v=>v!=null);function state(t){let active=0,segment=null;for(const s of D.segments){if(t<s.start){active=s.from;break}active=s.to;if(t>=s.start&&t<s.end){segment=s;break}}return{active,segment}}function hex(value){const text=String(value||'').trim();if(!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(text))return null;if(text.length===4)return'#'+text.slice(1).split('').map(ch=>ch+ch).join('');return text.toLowerCase()}function parseColor(value){if(Array.isArray(value))return value;if(typeof value!=='string')return null;const text=String(value).trim();const normalized=hex(text);if(normalized)return[parseInt(normalized.slice(1,3),16),parseInt(normalized.slice(3,5),16),parseInt(normalized.slice(5,7),16)];const named={white:[255,255,255],black:[0,0,0]};if(named[text.toLowerCase()])return named[text.toLowerCase()];const rgb=text.match(/^rgb\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)$/i);if(rgb)return[rgb[1],rgb[2],rgb[3]].map(Number);const ref=text.match(/^url\\(#([^)]+)\\)$/);if(!ref)return null;const def=svg.querySelector('#'+ref[1]);if(!def)return null;const stops=[...def.querySelectorAll('stop')].map(stop=>parseColor(stop.getAttribute('stop-color'))).filter(Boolean);if(!stops.length)return null;const totals=stops.reduce((acc,color)=>[acc[0]+color[0],acc[1]+color[1],acc[2]+color[2]],[0,0,0]);return totals.map(total=>total/stops.length)}function color(a,b,p){if(p<=0)return a;if(p>=1)return b;if(D.referencedColorInterpolation){const ra=parseColor(a),rb=parseColor(b);if(ra&&rb)return'rgb('+[0,1,2].map(i=>Math.round(L(ra[i],rb[i],p))).join(',')+')'}if(typeof a==='string'||typeof b==='string')return p<0.5?a:b;return'rgb('+[0,1,2].map(i=>Math.round(L(a[i],b[i],p))).join(',')+')'}function path(track,from,to,p){const a=pick(track.paths,from),b=pick(track.paths,to);if(!a||!b)return null;const ta=a.match(/[a-zA-Z]|-?\\d*\\.?\\d+(?:e[-+]?\\d+)?/g)||[],tb=b.match(/[a-zA-Z]|-?\\d*\\.?\\d+(?:e[-+]?\\d+)?/g)||[];let ni=0;const bn=tb.filter(token=>!/^[a-zA-Z]$/.test(token)).map(Number);return ta.map(token=>/^[a-zA-Z]$/.test(token)?token:String(L(Number(token),bn[ni++],p))).join(' ')} ;function render(t){const total=Math.max(.001,D.duration);t=D.infinite?((t%total)+total)%total:C(t/total)*total;const q=state(t),p=q.segment?E(C((t-q.segment.start)/Math.max(.001,q.segment.end-q.segment.start))):0,from=q.segment?q.segment.from:q.active,to=q.segment?q.segment.to:q.active;for(const tr of D.tracks){const el=scene.querySelector('[data-motion-id=\"'+CSS.escape(tr.id)+'\"]');if(!el)continue;if(el.hasAttribute('data-refresh-rotor')||el.hasAttribute('data-exact-ring')||el.getAttribute('data-static-connector')==='true')continue;const parent=el.parentNode;if(parent&&parent.closest&&parent.closest('[data-refresh-rotor],[data-exact-ring]'))continue;const pa=tr.present[from],pb=tr.present[to];if(!pa&&!pb){el.setAttribute('visibility','hidden');continue}el.setAttribute('visibility','visible');const na=pick(tr.numeric,from)||{},nb=pick(tr.numeric,to)||{};for(const name of D.numeric){if(na[name]!=null||nb[name]!=null)el.setAttribute(name,String(L(na[name],nb[name],p)))}const ca=pick(tr.colors,from)||{},cb=pick(tr.colors,to)||{};for(const name of D.colors){if(ca[name]&&cb[name])el.setAttribute(name,color(ca[name],cb[name],p))}if(tr.pathMode){const d=path(tr,from,to,p);if(d)el.setAttribute('d',d)}else if(tr.paths){const d=p<0.5?pick(tr.paths,from):pick(tr.paths,to);if(d)el.setAttribute('d',d)}let transformAttr='';const ma=pick(tr.transforms,from),mb=pick(tr.transforms,to);if(ma&&mb)transformAttr='matrix('+ma.map((v,i)=>L(v,mb[i],p)).join(' ')+')';const ra=pick(tr.rotations,from),rb=pick(tr.rotations,to);if(ra&&rb){let a=ra.angle,b=rb.angle;while(b-a>180)b-=360;while(a-b>180)b+=360;const rotateStr='rotate('+L(a,b,p)+' '+L(ra.cx,rb.cx,p)+' '+L(ra.cy,rb.cy,p)+')';transformAttr=transformAttr?transformAttr+' '+rotateStr:rotateStr;}if(transformAttr)el.setAttribute('transform',transformAttr);if(pa&&!pb)el.setAttribute('opacity',String(1-p));else if(!pa&&pb)el.setAttribute('opacity',String(p));else if(pa&&pb){const opa=na['opacity']!=null?L(na['opacity'],nb['opacity'],p):1;el.setAttribute('opacity',String(opa))}}const sorted=[];for(const tr of D.tracks){if(tr.zOrder){const el=scene.querySelector('[data-motion-id=\"'+CSS.escape(tr.id)+'\"]');if(el){if(el.parentNode!==scene)continue;const parent=el.parentNode;if(parent&&parent.closest&&parent.closest('[data-refresh-rotor],[data-exact-ring]'))continue;const za=pick(tr.zOrder,from),zb=pick(tr.zOrder,to);sorted.push({el,z:L(za,zb,p)})}}}const exactRing=scene.querySelector('[data-exact-ring]');if(exactRing){const connIdx=sorted.findIndex(item=>{const mid=item.el.getAttribute('data-motion-id');return(mid&&mid.includes('vector-1[0]'))||item.el.getAttribute('data-static-connector')==='true'});if(connIdx>=0){sorted.push({el:exactRing,z:sorted[connIdx].z-0.5})}else{sorted.push({el:exactRing,z:20})}}sorted.sort((a,b)=>a.z-b.z);for(const item of sorted)scene.appendChild(item.el)}function tick(now){if(!manual&&!paused)render((now-start)/1000);requestAnimationFrame(tick)}svg.__motionController={seek(t){manual=true;render(Number(t)||0)},play(){manual=false;paused=false;start=performance.now()},pause(){paused=true},restart(){manual=false;paused=false;start=performance.now();render(0)}};render(0);requestAnimationFrame(tick)})()";
  return"(()=>{const D="+json+",svg=(document.currentScript&&(document.currentScript.closest('svg')||document.currentScript.ownerDocument.querySelector('#motion-svg')||document.currentScript.ownerDocument.documentElement))||document.querySelector('#motion-svg')||document.documentElement,scene=svg.querySelector('#motion-scene');let start=performance.now(),manual=false,paused=false;const C=v=>Math.max(0,Math.min(1,v)),L=(a,b,p)=>(Number(a)||0)+((Number(b)||0)-(Number(a)||0))*p,E=p=>p*p*(3-2*p),pick=(arr,i)=>arr[i]!=null?arr[i]:arr.slice(0,i).reverse().find(v=>v!=null)??arr.find(v=>v!=null);function state(t){let active=0,segment=null;for(const s of D.segments){if(t<s.start){active=s.from;break}active=s.to;if(t>=s.start&&t<s.end){segment=s;break}}return{active,segment}}function hex(value){const text=String(value||'').trim();if(!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(text))return null;if(text.length===4)return'#'+text.slice(1).split('').map(ch=>ch+ch).join('');return text.toLowerCase()}function parseColor(value){if(Array.isArray(value))return value;if(typeof value!=='string')return null;const text=String(value).trim();const normalized=hex(text);if(normalized)return[parseInt(normalized.slice(1,3),16),parseInt(normalized.slice(3,5),16),parseInt(normalized.slice(5,7),16)];const named={white:[255,255,255],black:[0,0,0]};if(named[text.toLowerCase()])return named[text.toLowerCase()];const rgb=text.match(/^rgb\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)$/i);if(rgb)return[rgb[1],rgb[2],rgb[3]].map(Number);const ref=text.match(/^url\\(#([^)]+)\\)$/);if(!ref)return null;const def=svg.querySelector('#'+ref[1]);if(!def)return null;const stops=[...def.querySelectorAll('stop')].map(stop=>parseColor(stop.getAttribute('stop-color'))).filter(Boolean);if(!stops.length)return null;const totals=stops.reduce((acc,color)=>[acc[0]+color[0],acc[1]+color[1],acc[2]+color[2]],[0,0,0]);return totals.map(total=>total/stops.length)}function color(a,b,p){if(p<=0)return a;if(p>=1)return b;if(D.referencedColorInterpolation){const ra=parseColor(a),rb=parseColor(b);if(ra&&rb)return'rgb('+[0,1,2].map(i=>Math.round(L(ra[i],rb[i],p))).join(',')+')'}if(typeof a==='string'||typeof b==='string')return p<0.5?a:b;return'rgb('+[0,1,2].map(i=>Math.round(L(a[i],b[i],p))).join(',')+')'}function path(track,from,to,p){const a=pick(track.paths,from),b=pick(track.paths,to);if(!a||!b)return null;const ta=a.match(/[a-zA-Z]|-?\\d*\\.?\\d+(?:e[-+]?\\d+)?/g)||[],tb=b.match(/[a-zA-Z]|-?\\d*\\.?\\d+(?:e[-+]?\\d+)?/g)||[];let ni=0;const bn=tb.filter(token=>!/^[a-zA-Z]$/.test(token)).map(Number);return ta.map(token=>/^[a-zA-Z]$/.test(token)?token:String(L(Number(token),bn[ni++],p))).join(' ')} ;function topSceneChild(node){let current=node;while(current&&current.parentNode&&current.parentNode!==scene)current=current.parentNode;return current&&current.parentNode===scene?current:null}function render(t){const total=Math.max(.001,D.duration);t=D.infinite?((t%total)+total)%total:C(t/total)*total;const q=state(t),p=q.segment?E(C((t-q.segment.start)/Math.max(.001,q.segment.end-q.segment.start))):0,from=q.segment?q.segment.from:q.active,to=q.segment?q.segment.to:q.active;for(const tr of D.tracks){const el=scene.querySelector('[data-motion-id=\"'+CSS.escape(tr.id)+'\"]');if(!el)continue;if(el.hasAttribute('data-refresh-rotor')||el.hasAttribute('data-exact-ring')||el.getAttribute('data-static-connector')==='true')continue;const parent=el.parentNode;if(parent&&parent.closest&&parent.closest('[data-refresh-rotor],[data-exact-ring]'))continue;const pa=tr.present[from],pb=tr.present[to];if(!pa&&!pb){el.setAttribute('visibility','hidden');continue}el.setAttribute('visibility','visible');const na=pick(tr.numeric,from)||{},nb=pick(tr.numeric,to)||{};for(const name of D.numeric){if(na[name]!=null||nb[name]!=null)el.setAttribute(name,String(L(na[name],nb[name],p)))}const ca=pick(tr.colors,from)||{},cb=pick(tr.colors,to)||{};for(const name of D.colors){if(ca[name]&&cb[name])el.setAttribute(name,color(ca[name],cb[name],p))}if(tr.pathMode){const d=path(tr,from,to,p);if(d)el.setAttribute('d',d)}else if(tr.paths){const d=p<0.5?pick(tr.paths,from):pick(tr.paths,to);if(d)el.setAttribute('d',d)}let transformAttr='';const ma=pick(tr.transforms,from),mb=pick(tr.transforms,to);if(ma&&mb)transformAttr='matrix('+ma.map((v,i)=>L(v,mb[i],p)).join(' ')+')';const ra=pick(tr.rotations,from),rb=pick(tr.rotations,to);if(ra&&rb){let a=ra.angle,b=rb.angle;while(b-a>180)b-=360;while(a-b>180)b+=360;const rotateStr='rotate('+L(a,b,p)+' '+L(ra.cx,rb.cx,p)+' '+L(ra.cy,rb.cy,p)+')';transformAttr=transformAttr?transformAttr+' '+rotateStr:rotateStr;}if(transformAttr)el.setAttribute('transform',transformAttr);if(pa&&!pb)el.setAttribute('opacity',String(1-p));else if(!pa&&pb)el.setAttribute('opacity',String(p));else if(pa&&pb){const opa=na['opacity']!=null?L(na['opacity'],nb['opacity'],p):1;el.setAttribute('opacity',String(opa))}}const sorted=[];const seen=new Set();for(const tr of D.tracks){if(tr.zOrder){const el=scene.querySelector('[data-motion-id=\"'+CSS.escape(tr.id)+'\"]');if(el){const sortable=topSceneChild(el);if(!sortable)continue;const parent=sortable.parentNode;if(parent&&parent.closest&&parent.closest('[data-refresh-rotor],[data-exact-ring]'))continue;if(seen.has(sortable))continue;seen.add(sortable);const za=pick(tr.zOrder,from),zb=pick(tr.zOrder,to);sorted.push({el:sortable,z:L(za,zb,p)})}}}const exactRing=scene.querySelector('[data-exact-ring]');if(exactRing){const connIdx=sorted.findIndex(item=>{const mid=item.el.getAttribute('data-motion-id');return(mid&&mid.includes('vector-1[0]'))||item.el.getAttribute('data-static-connector')==='true'});if(connIdx>=0){sorted.push({el:exactRing,z:sorted[connIdx].z-0.5})}else{sorted.push({el:exactRing,z:20})}}sorted.sort((a,b)=>a.z-b.z);for(const item of sorted)scene.appendChild(item.el)}function tick(now){if(!manual&&!paused)render((now-start)/1000);requestAnimationFrame(tick)}svg.__motionController={seek(t){manual=true;render(Number(t)||0)},play(){manual=false;paused=false;start=performance.now()},pause(){paused=true},restart(){manual=false;paused=false;start=performance.now();render(0)}};render(0);requestAnimationFrame(tick)})()"
}

function validate(manifest){if(!manifest||manifest.schema!=='svg-motion-lab/figma-manifest@4')throw new Error('Multi-track engine yêu cầu manifest @4.');if(Number(manifest.fidelityMetadataVersion||0)<4||!manifest.capabilities||!manifest.capabilities.embeddedMotionIds)throw new Error('Hãy export lại bằng plugin mới để có embedded motion IDs.');if(!Array.isArray(manifest.states)||manifest.states.length<2)throw new Error('Manifest cần ít nhất 2 states.');return true}

function parsePieSlice(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  let i = 0;
  let start = null;
  let firstArc = [];
  let corner = null;
  let secondArc = [];
  let endLine = null;
  let mode = 'first';
  
  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === 'M') {
      start = [Number(tokens[i++]), Number(tokens[i++])];
    } else if (cmd === 'C') {
      const c = [
        Number(tokens[i++]), Number(tokens[i++]),
        Number(tokens[i++]), Number(tokens[i++]),
        Number(tokens[i++]), Number(tokens[i++])
      ];
      if (mode === 'first') {
        firstArc.push(c);
      } else {
        secondArc.push(c);
      }
    } else if (cmd === 'L') {
      const pt = [Number(tokens[i++]), Number(tokens[i++])];
      if (mode === 'first') {
        corner = pt;
        mode = 'second';
      } else {
        endLine = pt;
      }
    }
  }
  return { start, firstArc, corner, secondArc, endLine };
}

function padArc(arc, startPt, targetLength) {
  if (arc.length === 0) {
    const padded = [];
    const x = startPt[0], y = startPt[1];
    for (let j = 0; j < targetLength; j++) {
      padded.push([x, y, x, y, x, y]);
    }
    return padded;
  }
  
  const padded = [...arc];
  const lastCurve = arc[arc.length - 1];
  const lx = lastCurve[4], ly = lastCurve[5];
  while (padded.length < targetLength) {
    padded.push([lx, ly, lx, ly, lx, ly]);
  }
  return padded;
}

function serializePieSlice(slice) {
  const parts = [];
  parts.push(`M${slice.start[0]} ${slice.start[1]}`);
  slice.firstArc.forEach(c => {
    parts.push(`C${c[0]} ${c[1]} ${c[2]} ${c[3]} ${c[4]} ${c[5]}`);
  });
  if (slice.corner) {
    parts.push(`L${slice.corner[0]} ${slice.corner[1]}`);
  }
  slice.secondArc.forEach(c => {
    parts.push(`C${c[0]} ${c[1]} ${c[2]} ${c[3]} ${c[4]} ${c[5]}`);
  });
  if (slice.endLine) {
    parts.push(`L${slice.endLine[0]} ${slice.endLine[1]}`);
  }
  parts.push('Z');
  return parts.join('');
}

function compile(manifest,options){
  validate(manifest);
  const normalized=canonicalizeManifest(manifest);
  manifest=normalized;
  options=options||{};
  const base=options.baseSchedule||S.buildBaseSchedule(manifest),schedule=S.customSchedule(base,options.customSegments,options.infinite);
   const ordered=schedule.stateIds.map(id=>manifest.states.find(state=>state.id===id)).filter(Boolean),states=ordered.map(parseState),layerMaps=ordered.map(layerMap),ids=new Set();
  states.forEach(state=>state.map.forEach((_,id)=>ids.add(id)));
  const tracks=[...ids].map(id=>buildTrack(id,states.map(state=>state.map.get(id)||null),layerMaps.map(map=>map.get(id)||null),states)).filter(Boolean);
  
  // Identify rotating groups
  const rotatingGroupIds = new Set();
  tracks.forEach(t => {
    if (t.tag === 'g') {
      const hasRotation = t.rotations && t.rotations.some(r => r && r.angle !== 0);
      const isRefreshRotor = t.id.includes('hugeiconsrefresh');
      if (hasRotation || isRefreshRotor) {
        rotatingGroupIds.add(t.id);
      }
    }
  });

  // Disable pathMode for descendants of rotating groups to prevent double-rotation and distortion
  tracks.forEach(t => {
    if (t.tag === 'path') {
      const isDescendant = [...rotatingGroupIds].some(groupId => t.id.startsWith(groupId + '/'));
      if (isDescendant) {
        t.pathMode = false;
      }
    }
  });
  
  // Align pie slice paths across states to make them compatible
  tracks.forEach(track => {
    if (track.tag === 'path') {
      const nonNullPaths = track.paths.filter(Boolean);
      if (nonNullPaths.length >= 2) {
        try {
          const parsedSlices = track.paths.map(p => p ? parsePieSlice(p) : null);
          const validSlices = parsedSlices.filter(Boolean);
          const isPieSlice = (track.id.includes('piechart') || track.id.includes('mask-group')) && 
                             validSlices.every(s => s.start && (s.firstArc.length > 0 || s.secondArc.length > 0));
          if (isPieSlice) {
            let maxN1 = 0;
            let maxN2 = 0;
            validSlices.forEach(s => {
              if (s.firstArc.length > maxN1) maxN1 = s.firstArc.length;
              if (s.secondArc.length > maxN2) maxN2 = s.secondArc.length;
            });
            track.paths = parsedSlices.map((slice, idx) => {
              if (!slice) return null;
              slice.firstArc = padArc(slice.firstArc, slice.start, maxN1);
              slice.secondArc = padArc(slice.secondArc, slice.corner || slice.start, maxN2);
              return serializePieSlice(slice);
            });
            track.pathMode = compatiblePaths(track.paths);
          }
        } catch (e) {
          // Ignore
        }
      }
    }
  });
  normalizeNestedTrackTransforms(tracks);

  const baseSvg=states[0].svg.cloneNode(true);
  baseSvg.querySelectorAll('script').forEach(script=>script.remove());
  
  // Strip filters from any elements inside masks or clip-paths to avoid browser rendering bugs
  // (like opaque white bounding boxes).
  baseSvg.querySelectorAll('mask *, clipPath *').forEach(el => {
    if (el.hasAttribute('filter')) el.removeAttribute('filter');
  });
  baseSvg.querySelectorAll('[filter]').forEach(el => {
    let parent = el.parentNode;
    while (parent && parent !== baseSvg) {
      const tag = parent.tagName ? parent.tagName.toLowerCase() : '';
      if (parent.hasAttribute('mask') || parent.hasAttribute('clip-path') || tag === 'mask' || tag === 'clippath') {
        el.removeAttribute('filter');
        break;
      }
      parent = parent.parentNode;
    }
  });

  baseSvg.id='motion-svg';
  baseSvg.setAttribute('data-render-mode','multi-track-smart-animate');
  baseSvg.setAttribute('data-duration',S.round(schedule.totalDuration));
  baseSvg.setAttribute('data-infinite',String(schedule.infinite));

  let defsEl = baseSvg.querySelector('defs');
  if (!defsEl) {
    defsEl = baseSvg.ownerDocument.createElementNS(SVG_NS, 'defs');
    baseSvg.insertBefore(defsEl, baseSvg.firstChild);
  }
  defsEl.innerHTML = '';
  states.forEach(parsedState => {
    const collected = parsedState.state.collectedDefs || [];
    collected.forEach(defNode => {
      const imported = baseSvg.ownerDocument.importNode(defNode, true);
      defsEl.appendChild(imported);
    });
  });

  let scene=baseSvg.querySelector('#motion-scene');
  if(!scene){
    scene=baseSvg.ownerDocument.createElementNS(SVG_NS,'g');
    scene.id='motion-scene';
    [...baseSvg.children].filter(child=>String(child.tagName).toLowerCase()!=='defs').forEach(child=>scene.appendChild(child));
    baseSvg.appendChild(scene)
  }
  cloneMissingTracks(scene,tracks,states);
  const topSceneChild = (node) => {
    let current = node;
    while (current && current.parentNode && current.parentNode !== scene) current = current.parentNode;
    return current && current.parentNode === scene ? current : null;
  };
  const wrapperAwareZOrder = tracks.some(track => {
    if (!track.zOrder) return false;
    const split = track.id.indexOf(':@root');
    const motionPath = split < 0 ? track.id : track.id.slice(split + 1);
    if (motionPath !== '@root/active[0]') return false;
    const el = scene.querySelector('[data-motion-id="' + CSS.escape(track.id) + '"]');
    if (!el) return false;
    const sortable = topSceneChild(el);
    return sortable && sortable !== el && !sortable.getAttribute('data-motion-id');
  });
  const referencedColorInterpolation = tracks.some(track => {
    const split = track.id.indexOf(':@root');
    const motionPath = split < 0 ? track.id : track.id.slice(split + 1);
    if (!/^@root\/line\[\d+\]$/.test(motionPath)) return false;
    const values = [];
    for (const colors of track.colors || []) {
      if (!colors) continue;
      Object.values(colors).forEach(value => {
        if (value != null) values.push(value);
      });
    }
    const hasReferencePaint = values.some(value => typeof value === 'string' && /^url\(#/.test(value));
    const hasSolidColor = values.some(value => Array.isArray(value));
    return hasReferencePaint && hasSolidColor;
  });
  normalizeEquivalentPaintRefsInTracks(tracks, baseSvg);
  const data={duration:schedule.totalDuration,infinite:schedule.infinite,numeric:NUMERIC,colors:COLOR,segments:schedule.segments.map(segment=>({from:schedule.stateIds.indexOf(segment.from),to:schedule.stateIds.indexOf(segment.to),start:segment.transitionStart,end:segment.transitionEnd})),tracks};
  if (wrapperAwareZOrder) data.wrapperAwareZOrder = true;
  if (referencedColorInterpolation) data.referencedColorInterpolation = true;
  const script=document.createElementNS(SVG_NS,'script');
  script.textContent=runtime(data);
  baseSvg.appendChild(script);
  const report={renderMode:'multi-track-smart-animate',totalTracks:tracks.length,pathMorphTracks:tracks.filter(t=>t.pathMode).length,transformTracks:tracks.filter(t=>t.transforms.filter(Boolean).length>1).length,rotationTracks:tracks.filter(t=>t.rotations.filter(Boolean).length>1).length,colorTracks:tracks.filter(t=>t.colors.some(c=>Object.keys(c).length)).length,presenceTracks:tracks.filter(t=>t.present.some(Boolean)&&t.present.some(v=>!v)).length,fullStateSnapshots:0,embeddedMotionIds:true,genericAnimationTypes:['numeric-geometry','translate','scale','matrix-transform','rotation','opacity','visibility','solid-color','path-morph','appear-disappear']};
  const svg='<?xml version="1.0" encoding="UTF-8"?>'+new XMLSerializer().serializeToString(baseSvg),html=S.buildHtml(svg,schedule),ir={version:5,startStateId:schedule.stateIds[0],stateOrder:schedule.stateIds.slice(),playback:{infinite:schedule.infinite,totalDuration:schedule.totalDuration,segments:schedule.segments},smartAnimate:report};
  return{svg,html,ir,report:{report:Object.assign({manifestSchema:manifest.schema,prototypeReady:true,snapshotsReady:true,infinite:schedule.infinite,customDuration:schedule.totalDuration},report),schedule},schedule,semanticReport:report,normalizedManifest:normalized}
}

root.SvgMotionCompiler={validate,buildBaseSchedule:S.buildBaseSchedule,compile,matchGeometryGloballyV2,getAbsoluteBounds};
})(window);
