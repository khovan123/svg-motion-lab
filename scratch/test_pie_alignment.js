const d0 = "M225.749 72.2262C222.882 76.8832 221.257 82.1971 221.028 87.6608C220.799 93.1245 221.974 98.5557 224.441 103.436L238.721 96.2181C237.487 93.7779 236.9 91.0623 237.014 88.3304C237.128 85.5986 237.941 82.9416 239.374 80.6131L225.749 72.2262Z";
const d1 = "M285 89C285 84.7977 284.172 80.6365 282.564 76.7541C280.956 72.8717 278.599 69.3441 275.627 66.3726C272.656 63.4011 269.128 61.044 265.246 59.4359C261.363 57.8277 257.202 57 253 57L253 73C255.101 73 257.182 73.4139 259.123 74.2179C261.064 75.022 262.828 76.2006 264.314 77.6863C265.799 79.172 266.978 80.9359 267.782 82.8771C268.586 84.8183 269 86.8988 269 89L285 89Z";

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

const s0 = parsePieSlice(d0);
const s1 = parsePieSlice(d1);

const maxN1 = Math.max(s0.firstArc.length, s1.firstArc.length);
const maxN2 = Math.max(s0.secondArc.length, s1.secondArc.length);

s0.firstArc = padArc(s0.firstArc, s0.start, maxN1);
s0.secondArc = padArc(s0.secondArc, s0.corner || s0.start, maxN2);

s1.firstArc = padArc(s1.firstArc, s1.start, maxN1);
s1.secondArc = padArc(s1.secondArc, s1.corner || s1.start, maxN2);

const norm0 = serializePieSlice(s0);
const norm1 = serializePieSlice(s1);

console.log("Padded s0:");
console.log(norm0);
console.log("Padded s1:");
console.log(norm1);

function getTemplate(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  const commands = tokens.filter(x => /^[a-zA-Z]$/.test(x)).join('');
  const numCount = tokens.filter(x => !/^[a-zA-Z]$/.test(x)).length;
  return { commands, numCount };
}

const t0 = getTemplate(norm0);
const t1 = getTemplate(norm1);
console.log(`t0: commands="${t0.commands}", numbers=${t0.numCount}`);
console.log(`t1: commands="${t1.commands}", numbers=${t1.numCount}`);
console.log(`Compatible? ${t0.commands === t1.commands && t0.numCount === t1.numCount}`);
