#!/usr/bin/env node
const fs = require('fs');

const filePath = process.argv[2] || 'dist/animation.html';
let html = fs.readFileSync(filePath, 'utf8');

// PROBLEM 1:
// The SVG has <g> wrapper elements (with clip-path) that contain ALL elements
// of a state. Both the <g> wrapper AND its children have identical transform
// data. In SVG, parent and child transforms compound, causing elements to
// move DOUBLE the intended distance (g.transform × child.transform).
//
// PROBLEM 2:
// Content elements inside each card (badge text, schedule icons, avatar groups)
// have identity transforms, so they don't slide with their parent card frame.
// This "tears" the card apart visually — the background slides but text/icons
// stay in place.
//
// FIX 1:
// Identify <g> wrapper tracks by their SVG element type + clip-path, and
// set their transforms to identity matrices. The children inside already
// have the correct transforms and will animate properly on their own.
//
// FIX 2:
// Identify card frame tracks (IDs matching @root/list[0]/frame[N] without
// trailing path segments). For each frame with non-identity transforms,
// propagate those transforms to all child tracks (IDs starting with the
// frame's ID followed by "/"). This makes content slide together with
// its card frame as a single unit.

// ---- Helper: zero a track's transforms & rotations at a given JSON offset ----
function zeroTransforms(html, idPattern, idIdx) {
  const searchFrom = idIdx + idPattern.length;
  const transformsIdx = html.indexOf('"transforms"', searchFrom);
  if (transformsIdx < 0) return html;
  
  const valStart = html.indexOf('[[', transformsIdx);
  if (valStart < 0) return html;
  let bracketDepth = 2;
  let valEnd = valStart + 2;
  while (valEnd < html.length && bracketDepth > 0) {
    if (html[valEnd] === '[') bracketDepth++;
    if (html[valEnd] === ']') bracketDepth--;
    valEnd++;
  }
  
  const identityTransforms = '[[1,0,0,1,0,0],[1,0,0,1,0,0]]';
  html = html.substring(0, valStart) + identityTransforms + html.substring(valEnd);
  
  const afterTransforms = valStart + identityTransforms.length;
  const rotationsIdx = html.indexOf('"rotations"', afterTransforms);
  if (rotationsIdx < 0) return html;
  
  const rotValStart = html.indexOf('[', rotationsIdx + 11);
  if (rotValStart < 0) return html;
  bracketDepth = 1;
  let rotValEnd = rotValStart + 1;
  while (rotValEnd < html.length && bracketDepth > 0) {
    if (html[rotValEnd] === '{') bracketDepth++;
    if (html[rotValEnd] === '}') bracketDepth--;
    if (html[rotValEnd] === '[') bracketDepth++;
    if (html[rotValEnd] === ']') bracketDepth--;
    rotValEnd++;
  }
  
  const identityRotations = '[{"angle":0,"cx":0,"cy":0},{"angle":0,"cx":0,"cy":0}]';
  html = html.substring(0, rotValStart) + identityRotations + html.substring(rotValEnd);
  return html;
}

// ---- Helper: replace transforms & rotations at a known JSON offset ----
function setTransformsAt(html, setAtIdx, transforms, rotations) {
  const transformsStr = JSON.stringify(transforms);
  const rotationsStr = JSON.stringify(rotations);
  
  const valStart = html.indexOf('[[', setAtIdx);
  if (valStart < 0) return html;
  let bracketDepth = 2;
  let valEnd = valStart + 2;
  while (valEnd < html.length && bracketDepth > 0) {
    if (html[valEnd] === '[') bracketDepth++;
    if (html[valEnd] === ']') bracketDepth--;
    valEnd++;
  }
  html = html.substring(0, valStart) + transformsStr + html.substring(valEnd);
  
  const afterTransforms = valStart + transformsStr.length;
  const rotationsIdx = html.indexOf('"rotations"', afterTransforms);
  if (rotationsIdx < 0) return html;
  
  const rotValStart = html.indexOf('[', rotationsIdx + 11);
  if (rotValStart < 0) return html;
  bracketDepth = 1;
  let rotValEnd = rotValStart + 1;
  while (rotValEnd < html.length && bracketDepth > 0) {
    if (html[rotValEnd] === '{') bracketDepth++;
    if (html[rotValEnd] === '}') bracketDepth--;
    if (html[rotValEnd] === '[') bracketDepth++;
    if (html[rotValEnd] === ']') bracketDepth--;
    rotValEnd++;
  }
  html = html.substring(0, rotValStart) + rotationsStr + html.substring(rotValEnd);
  return html;
}

// ---- Step 1: Collect motion IDs of <g> wrappers that have clip-path ----
const wrapperIds = [];
const wrapperOrder1 = /<g[^>]*clip-path[^>]*data-motion-id="([^"]+)"[^>]*>/g;
const wrapperOrder2 = /<g[^>]*data-motion-id="([^"]+)"[^>]*clip-path[^>]*>/g;
let m;
while ((m = wrapperOrder1.exec(html)) !== null) wrapperIds.push(m[1]);
while ((m = wrapperOrder2.exec(html)) !== null) wrapperIds.push(m[1]);
console.log('Found ' + wrapperIds.length + ' <g> clip-path wrappers');

// ---- Step 2: Zero wrapper <g> transforms (prevents SVG transform compounding) ----
for (const id of wrapperIds) {
  const atRootIdx = id.indexOf('@root');
  let isLayout = false;
  if (atRootIdx >= 0) {
    const pathPart = id.substring(atRootIdx);
    isLayout = /^@root\/list\[\d+\](\/frame\[\d+\])?$/.test(pathPart);
  }
  if (isLayout) {
    console.log('Skipping zeroing transform for layout container: ' + id);
    continue;
  }
  const idPattern = '"id":"' + id + '"';
  const idIdx = html.indexOf(idPattern);
  if (idIdx < 0) {
    console.warn('  Warning: wrapper ID not found in D data (may already be fixed)');
    continue;
  }
  html = zeroTransforms(html, idPattern, idIdx);
}
console.log('Fixed transforms for ' + wrapperIds.length + ' wrapper <g> elements');

// ---- Step 3: Propagate card frame slide transforms to content children ----
// (Disabled: child elements are now correctly nested in the DOM and inherit parent transforms naturally)
const dStart = html.indexOf('const D=');
const dEndComma = html.indexOf(',svg=', dStart);
const dStr = html.substring(dStart + 8, dEndComma);
const d = JSON.parse(dStr);

// We keep the D data unchanged because relative transforms are now compiled directly.
const newDStr = JSON.stringify(d);
html = html.substring(0, dStart + 8) + newDStr + html.substring(dEndComma);

fs.writeFileSync(filePath, html, 'utf8');
console.log('Written ' + filePath);
