const fs = require('fs');
const pathModule = require('path');
const { JSDOM } = require(pathModule.resolve('node_modules/jsdom'));

const svgStr = fs.readFileSync('dist/animation.svg', 'utf8');

const { window } = new JSDOM(svgStr, { runScripts: "dangerously" });
const doc = window.document;
const svg = doc.documentElement;

// Find D from script
const scriptEl = doc.querySelector('script');
const scriptText = scriptEl ? scriptEl.textContent : '';
const match = scriptText.match(/const D=(.*?),\s*svg=/);
if (!match) {
  console.log("Could not find data D in SVG script!");
  process.exit(1);
}
const D = JSON.parse(match[1]);

console.log("Timeline total duration:", D.duration);
console.log("Segments:", D.segments.length);

const C = v => Math.max(0, Math.min(1, v));
const L = (a, b, p) => (Number(a) || 0) + ((Number(b) || 0) - (Number(a) || 0)) * p;
const E = p => p * p * (3 - 2 * p);
const pick = (arr, i) => arr[i] != null ? arr[i] : arr.slice(0, i).reverse().find(v => v != null) ?? arr.find(v => v != null);

function state(t) {
  let active = 0, segment = null;
  for (const s of D.segments) {
    if (t < s.start) {
      active = s.from;
      break;
    }
    active = s.to;
    if (t >= s.start && t < s.end) {
      segment = s;
      break;
    }
  }
  return { active, segment };
}

function color(a, b, p) {
  return 'rgb(' + [0, 1, 2].map(i => Math.round(L(a[i], b[i], p))).join(',') + ')';
}

function interpolatePath(track, from, to, p) {
  const a = pick(track.paths, from), b = pick(track.paths, to);
  if (!a || !b) return null;
  const ta = a.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  const tb = b.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  let ni = 0;
  const bn = tb.filter(token => !/^[a-zA-Z]$/.test(token)).map(Number);
  return ta.map(token => /^[a-zA-Z]$/.test(token) ? token : String(L(Number(token), bn[ni++], p))).join(' ');
}

function render(t) {
  const total = Math.max(.001, D.duration);
  t = D.infinite ? ((t % total) + total) % total : C(t / total) * total;
  const q = state(t);
  const p = q.segment ? E(C((t - q.segment.start) / Math.max(.001, q.segment.end - q.segment.start))) : 0;
  const from = q.segment ? q.segment.from : q.active;
  const to = q.segment ? q.segment.to : q.active;
  
  for (const tr of D.tracks) {
    const el = doc.querySelector('[data-motion-id="' + tr.id + '"]');
    if (!el) continue;
    const pa = tr.present[from], pb = tr.present[to];
    if (!pa && !pb) {
      el.setAttribute('opacity', '0'); // hidden
      continue;
    }
    
    const na = pick(tr.numeric, from) || {}, nb = pick(tr.numeric, to) || {};
    for (const name of D.numeric) {
      if (na[name] != null || nb[name] != null) el.setAttribute(name, String(L(na[name], nb[name], p)));
    }
    
    const ca = pick(tr.colors, from) || {}, cb = pick(tr.colors, to) || {};
    for (const name of D.colors) {
      if (ca[name] && cb[name]) el.setAttribute(name, color(ca[name], cb[name], p));
    }
    
    if (tr.pathMode) {
      const d = interpolatePath(tr, from, to, p);
      if (d) el.setAttribute('d', d);
    }
    
    let transformAttr = '';
    const ma = pick(tr.transforms, from), mb = pick(tr.transforms, to);
    if (ma && mb) transformAttr = 'matrix(' + ma.map((v, i) => L(v, mb[i], p)).join(' ') + ')';
    
    const ra = pick(tr.rotations, from), rb = pick(tr.rotations, to);
    if (ra && rb) {
      let a = ra.angle, b = rb.angle;
      while (b - a > 180) b -= 360;
      while (a - b > 180) b += 360;
      const rotateStr = 'rotate(' + L(a, b, p) + ' ' + L(ra.cx, rb.cx, p) + ' ' + L(ra.cy, rb.cy, p) + ')';
      transformAttr = transformAttr ? transformAttr + ' ' + rotateStr : rotateStr;
    }
    if (transformAttr) el.setAttribute('transform', transformAttr);
    
    if (pa && !pb) el.setAttribute('opacity', String(1 - p));
    else if (!pa && pb) el.setAttribute('opacity', String(p));
  }
}

// Print elements at key times
const targetIds = [
  '1:4181:@root/bar-chart[0]/2nd-column[0]/background[0]',
  '1:4181:@root/bar-chart[0]/2nd-column[0]/active[0]',
  '1:4181:@root/piechart[0]/mask-group-orange[0]/orange[1]'
];

const checkTimes = [0, 1.2, 2.8, 4.4, 6.0, 7.6, 9.2, 10.8, 12.0];
checkTimes.forEach(t => {
  render(t);
  const q = state(t);
  console.log(`\n--- Time: ${t.toFixed(1)}s (from State ${q.segment ? q.segment.from : q.active} to ${q.segment ? q.segment.to : q.active}, segment progress: ${(q.segment ? E(C((t - q.segment.start) / Math.max(.001, q.segment.end - q.segment.start))) : 0).toFixed(2)}) ---`);
  targetIds.forEach(id => {
    const el = doc.querySelector('[data-motion-id="' + id + '"]');
    if (el) {
      console.log(`Node: ${id}`);
      console.log(`  fill: ${el.getAttribute('fill')}`);
      console.log(`  opacity: ${el.getAttribute('opacity')}`);
      console.log(`  transform: ${el.getAttribute('transform')}`);
      if (el.getAttribute('d')) {
        console.log(`  d: ${el.getAttribute('d').slice(0, 70)}...`);
      }
    } else {
      console.log(`Node not found: ${id}`);
    }
  });
});
