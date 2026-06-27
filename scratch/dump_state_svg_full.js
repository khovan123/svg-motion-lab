const fs = require('fs');
const { JSDOM } = require('jsdom');

const manifest = JSON.parse(fs.readFileSync('motion-manifest.json', 'utf8'));
const state = manifest.states[0];

if (state.svg) {
  const dom = new JSDOM(state.svg);
  const doc = dom.window.document;
  
  // Recursively print node tree
  function printNode(node, indent = '') {
    if (node.nodeType === 1) { // Element node
      if (node.tagName.toLowerCase() === 'defs') {
        console.log(`${indent}<defs>[TRUNCATED DEFS]</defs>`);
        return;
      }
      let attrs = '';
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        if (attr.name !== 'd' || attr.value.length < 50) { // Don't dump extremely long paths
          attrs += ` ${attr.name}="${attr.value}"`;
        } else {
          attrs += ` ${attr.name}="[PATH_DATA_LONG (${attr.value.length} chars)]"`;
        }
      }
      console.log(`${indent}<${node.tagName.toLowerCase()}${attrs}>`);
      for (let i = 0; i < node.childNodes.length; i++) {
        printNode(node.childNodes[i], indent + '  ');
      }
      console.log(`${indent}</${node.tagName.toLowerCase()}>`);
    } else if (node.nodeType === 3) { // Text node
      const text = node.nodeValue.trim();
      if (text) {
        console.log(`${indent}"${text}"`);
      }
    }
  }

  printNode(doc.documentElement);
} else {
  console.log('No SVG in state');
}
