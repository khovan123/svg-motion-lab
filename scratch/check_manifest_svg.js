const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));

manifest.states.forEach((state, stateIdx) => {
  console.log(`\nState ${stateIdx} (${state.name}):`);
  const doc = new (require('jsdom').JSDOM)(state.svg).window.document;
  const el = doc.querySelector('[data-motion-id="1:4475:@root/doc-icon[0]/background[0]"]');
  if (el) {
    console.log("Outer HTML:", el.outerHTML);
  } else {
    console.log("NOT FOUND!");
  }
});
