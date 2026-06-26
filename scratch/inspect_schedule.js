const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const { buildAutoplay, buildPrototypeIR, orderStates } = require('../src/figma-motion-compiler');

const states = orderStates(manifest);
const prototype = buildPrototypeIR(manifest, states);
const schedule = buildAutoplay(states, prototype, {
  defaultHold: 0.7,
  defaultDuration: 0.4,
  springSamples: 36,
  precision: 4,
  loop: true
});

console.log("Total states in schedule:", schedule.stateIds.length);
console.log("State IDs in order:", schedule.stateIds);
console.log("Segments:");
schedule.segments.forEach((seg, idx) => {
  console.log(`Segment ${idx}: from="${seg.from}" (idx ${schedule.stateIds.indexOf(seg.from)}) -> to="${seg.to}" (idx ${schedule.stateIds.indexOf(seg.to)}) from ${seg.transitionStart.toFixed(2)}s to ${seg.transitionEnd.toFixed(2)}s`);
});
console.log("Total duration:", schedule.totalDuration);
