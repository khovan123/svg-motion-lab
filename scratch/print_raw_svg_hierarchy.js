const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest3.json', 'utf8'));

const printStateTree = (stateIdx) => {
  const state = manifest.states[stateIdx];
  console.log(`\n================ State ${stateIdx}: ${state.name} ================`);
  const doc = new JSDOM(state.svg, { contentType: 'image/svg+xml' }).window.document;
  
  const printEl = (el, indent = '') => {
    let tag = el.tagName.toLowerCase();
    let attrs = '';
    Array.from(el.attributes).forEach(attr => {
      if (['id', 'data-motion-id', 'transform', 'fill', 'stroke', 'd'].includes(attr.name)) {
        let val = attr.value;
        if (attr.name === 'd') {
          val = val.substring(0, 40) + '...';
        }
        attrs += ` ${attr.name}="${val}"`;
      }
    });
    console.log(`${indent}<${tag}${attrs}>`);
    Array.from(el.children).forEach(child => {
      printEl(child, indent + '  ');
    });
  };

  printEl(doc.documentElement);
};

printStateTree(3);
