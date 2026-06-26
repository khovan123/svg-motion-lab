const state0Path = "M253 57C247.532 57 242.154 58.4014 237.381 61.0705C232.608 63.7395 228.599 67.5872 225.736 72.2463L239.368 80.6232C240.8 78.2936 242.804 76.3698 245.191 75.0352C247.577 73.7007 250.266 73 253 73V57Z";
const state1Path = "M225.844 72.0728C222.29 77.7744 220.62 84.4499 221.073 91.1532C221.525 97.8565 224.075 104.247 228.362 109.42L240.681 99.2101C238.538 96.6237 237.262 93.4283 237.036 90.0766C236.81 86.725 237.645 83.3872 239.422 80.5364L225.844 72.0728Z";

function normalizePath(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  let i = 0;
  let cx = 0, cy = 0;
  let startX = 0, startY = 0;
  const result = [];
  
  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === 'M') {
      cx = Number(tokens[i++]); cy = Number(tokens[i++]);
      startX = cx; startY = cy;
      result.push(`M${cx} ${cy}`);
    } else if (cmd === 'm') {
      cx += Number(tokens[i++]); cy += Number(tokens[i++]);
      startX = cx; startY = cy;
      result.push(`M${cx} ${cy}`);
    } else if (cmd === 'L') {
      cx = Number(tokens[i++]); cy = Number(tokens[i++]);
      result.push(`L${cx} ${cy}`);
    } else if (cmd === 'l') {
      cx += Number(tokens[i++]); cy += Number(tokens[i++]);
      result.push(`L${cx} ${cy}`);
    } else if (cmd === 'H') {
      cx = Number(tokens[i++]);
      result.push(`L${cx} ${cy}`);
    } else if (cmd === 'h') {
      cx += Number(tokens[i++]);
      result.push(`L${cx} ${cy}`);
    } else if (cmd === 'V') {
      cy = Number(tokens[i++]);
      result.push(`L${cx} ${cy}`);
    } else if (cmd === 'v') {
      cy += Number(tokens[i++]);
      result.push(`L${cx} ${cy}`);
    } else if (cmd === 'C') {
      const x1 = Number(tokens[i++]), y1 = Number(tokens[i++]);
      const x2 = Number(tokens[i++]), y2 = Number(tokens[i++]);
      cx = Number(tokens[i++]); cy = Number(tokens[i++]);
      result.push(`C${x1} ${y1} ${x2} ${y2} ${cx} ${cy}`);
    } else if (cmd === 'c') {
      const x1 = cx + Number(tokens[i++]), y1 = cy + Number(tokens[i++]);
      const x2 = cx + Number(tokens[i++]), y2 = cy + Number(tokens[i++]);
      cx += Number(tokens[i++]); cy += Number(tokens[i++]);
      result.push(`C${x1} ${y1} ${x2} ${y2} ${cx} ${cy}`);
    } else if (cmd === 'S') {
      const x2 = Number(tokens[i++]), y2 = Number(tokens[i++]);
      cx = Number(tokens[i++]); cy = Number(tokens[i++]);
      result.push(`S${x2} ${y2} ${cx} ${cy}`);
    } else if (cmd === 's') {
      const x2 = cx + Number(tokens[i++]), y2 = cy + Number(tokens[i++]);
      cx += Number(tokens[i++]); cy += Number(tokens[i++]);
      result.push(`S${x2} ${y2} ${cx} ${cy}`);
    } else if (cmd === 'Q') {
      const x1 = Number(tokens[i++]), y1 = Number(tokens[i++]);
      cx = Number(tokens[i++]); cy = Number(tokens[i++]);
      result.push(`Q${x1} ${y1} ${cx} ${cy}`);
    } else if (cmd === 'q') {
      const x1 = cx + Number(tokens[i++]), y1 = cy + Number(tokens[i++]);
      cx += Number(tokens[i++]); cy += Number(tokens[i++]);
      result.push(`Q${x1} ${y1} ${cx} ${cy}`);
    } else if (cmd === 'T') {
      cx = Number(tokens[i++]); cy = Number(tokens[i++]);
      result.push(`T${cx} ${cy}`);
    } else if (cmd === 't') {
      cx += Number(tokens[i++]); cy += Number(tokens[i++]);
      result.push(`T${cx} ${cy}`);
    } else if (cmd === 'A') {
      const rx = Number(tokens[i++]), ry = Number(tokens[i++]);
      const rot = Number(tokens[i++]), laf = Number(tokens[i++]), sf = Number(tokens[i++]);
      cx = Number(tokens[i++]); cy = Number(tokens[i++]);
      result.push(`A${rx} ${ry} ${rot} ${laf} ${sf} ${cx} ${cy}`);
    } else if (cmd === 'a') {
      const rx = Number(tokens[i++]), ry = Number(tokens[i++]);
      const rot = Number(tokens[i++]), laf = Number(tokens[i++]), sf = Number(tokens[i++]);
      cx += Number(tokens[i++]); cy += Number(tokens[i++]);
      result.push(`A${rx} ${ry} ${rot} ${laf} ${sf} ${cx} ${cy}`);
    } else if (cmd === 'Z' || cmd === 'z') {
      cx = startX; cy = startY;
      result.push('Z');
    }
  }
  return result.join('');
}

const norm0 = normalizePath(state0Path);
const norm1 = normalizePath(state1Path);

console.log(`Original State 0: ${state0Path}`);
console.log(`Normalized State 0: ${norm0}`);
console.log(`Original State 1: ${state1Path}`);
console.log(`Normalized State 1: ${norm1}`);

function getTemplate(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  const commands = tokens.filter(x => /^[a-zA-Z]$/.test(x)).join('');
  const numCount = tokens.filter(x => !/^[a-zA-Z]$/.test(x)).length;
  return { commands, numCount };
}

const temp0 = getTemplate(norm0);
const temp1 = getTemplate(norm1);

console.log(`\nTemplate 0: commands="${temp0.commands}", numbers=${temp0.numCount}`);
console.log(`Template 1: commands="${temp1.commands}", numbers=${temp1.numCount}`);
console.log(`Are they compatible? ${temp0.commands === temp1.commands && temp0.numCount === temp1.numCount}`);
